import { userModel, businessModel } from '../../database';
import { HTTP_STATUS, isValidObjectId, resolvePagination, responseSuccess, responseError, internalServerError, USER_ROLES } from '../../common';
import { reqInfo, responseMessage, redisGet, redisSet, redisDelPattern } from '../../helper';

const formatBusinessDoc = (business: any) => {
    const user = business.userId;
    if (!user) return null;

    let familyMember = null;
    let source: 'head' | 'familyMember' = 'head';
    if (business.familyMemberId && user.familyMembers) {
        familyMember = user.familyMembers.find((m: any) => String(m._id) === String(business.familyMemberId));
        if (familyMember) {
            source = 'familyMember';
        }
    }

    const ownerPhone =
        business.contactInfo?.mobile1 ||
        (source === 'familyMember' ? familyMember?.phoneNumber : null) ||
        user.phoneNumber;

    return {
        owner: {
            userId: user._id,
            familyMemberId: familyMember?._id || null,
            source,
            firstName: source === 'familyMember' ? familyMember?.firstName : user.firstName,
            lastName: source === 'familyMember' ? familyMember?.lastName : user.lastName,
            profilePhoto: source === 'familyMember' ? familyMember?.profilePhoto : user.profilePhoto,
            phoneNumber: ownerPhone,
            village: user.village,
            currentCity: user.currentCity,
        },
        business: {
            _id: business._id,
            category: business.category || null,
            subCategory: business.subCategory || [],
            businessName: business.businessName,
            ownerName: business.ownerName || null,
            description: business.description || null,
            locations: business.locations || [],
            contactInfo: business.contactInfo || {},
            businessLogo: business.businessLogo || null,
            businessBanner: business.businessBanner || null,
            businessPhotos: business.businessPhotos || [],
        },
    };
};

export const getBusinesses = async (req, res) => {
    reqInfo(req);
    try {
        const { page, limit, category, subCategory, city, search } = req.query || {};

        const cacheKey = `businesses:list:${JSON.stringify(req.query)}`;
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
            return responseSuccess(res, responseMessage.getDataSuccess('Businesses'), JSON.parse(cachedData));
        }

        let criteria: any = {
            isDeleted: false,
            isActive: true
        };

        if (category) {
            criteria.category = { $regex: `^${category.trim()}$`, $options: 'i' };
        }

        if (subCategory) {
            criteria.subCategory = { $regex: `^${subCategory.trim()}$`, $options: 'i' };
        }

        if (search) {
            const searchRegex = new RegExp(search.trim(), 'i');
            const matchingUsers = await userModel.find({
                isDeleted: false,
                isActive: true,
                $or: [
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { 'familyMembers.firstName': searchRegex },
                    { 'familyMembers.lastName': searchRegex }
                ]
            }, { _id: 1, familyMembers: 1 });

            const userIds = matchingUsers.map(u => u._id);
            const familyMemberIds = matchingUsers.flatMap(u => (u.familyMembers || []).map(m => m._id));

            criteria.$or = [
                { businessName: searchRegex },
                { category: searchRegex },
                { subCategory: searchRegex },
                { description: searchRegex },
                { ownerName: searchRegex },
                { userId: { $in: userIds } },
                { familyMemberId: { $in: familyMemberIds } }
            ];
        }

        if (city) {
            const cityRegex = new RegExp(city.trim(), 'i');
            const matchingCityUsers = await userModel.find({
                isDeleted: false,
                isActive: true,
                $or: [
                    { village: cityRegex },
                    { currentCity: cityRegex }
                ]
            }, { _id: 1 });
            const cityUserIds = matchingCityUsers.map(u => u._id);

            criteria.$or = criteria.$or || [];
            criteria.$or.push({ 'locations.areaCity': cityRegex });
            criteria.$or.push({ userId: { $in: cityUserIds } });
        }

        const totalCount = await businessModel.countDocuments(criteria);
        const { skip, limit: limitValue, hasLimit } = resolvePagination(page, limit, totalCount);

        let query = businessModel.find(criteria)
            .populate({
                path: 'userId',
                select: 'firstName lastName profilePhoto phoneNumber village currentCity familyMembers'
            })
            .sort({ businessName: 1 });

        if (hasLimit) {
            query = query.skip(skip).limit(limitValue);
        }

        const results = await query;
        const formatted = results.map(formatBusinessDoc).filter(Boolean);
        const stateObj = resolvePagination(page, limit, totalCount);

        const result = {
            data: formatted,
            totalData: totalCount,
            state: stateObj,
        };

        await redisSet(cacheKey, JSON.stringify(result), 600);

        return responseSuccess(res, responseMessage.getDataSuccess('Businesses'), result);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const getBusinessById = async (req, res) => {
    reqInfo(req);
    try {
        const { id } = req.params;
        const { familyMemberId } = req.query || {};

        const cacheKey = `businesses:detail:${id}:${familyMemberId || 'head'}`;
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
            return responseSuccess(res, responseMessage.getDataSuccess('Business details'), JSON.parse(cachedData));
        }

        // Try finding by business ID first
        let business = await businessModel.findOne({ _id: isValidObjectId(id), isDeleted: false })
            .populate({
                path: 'userId',
                select: 'firstName lastName profilePhoto phoneNumber village currentCity familyMembers'
            });

        if (!business) {
            // Fallback: assume id is userId
            let queryCriteria: any = { userId: isValidObjectId(id), isDeleted: false };
            if (familyMemberId) {
                queryCriteria.familyMemberId = isValidObjectId(familyMemberId);
            } else {
                queryCriteria.familyMemberId = null;
            }
            business = await businessModel.findOne(queryCriteria)
                .populate({
                    path: 'userId',
                    select: 'firstName lastName profilePhoto phoneNumber village currentCity familyMembers'
                });
        }

        if (!business) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound('Business'));
        }

        const entry = formatBusinessDoc(business);
        await redisSet(cacheKey, JSON.stringify(entry), 600);

        return responseSuccess(res, responseMessage.getDataSuccess('Business details'), entry);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const createBusiness = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        const body = req.body || {};

        // If familyMemberId is provided, verify it belongs to user
        if (body.familyMemberId) {
            const member = (user.familyMembers || []).find(
                (m: any) => String(m._id) === String(body.familyMemberId)
            );
            if (!member) {
                return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound('Family member'));
            }
        }

        const newBusiness = new businessModel({
            ...body,
            userId: user._id,
        });

        const response = await newBusiness.save();
        if (!response) {
            return responseError(res, HTTP_STATUS.BAD_REQUEST, responseMessage.addDataError);
        }

        await redisDelPattern('businesses:list:*');
        await redisDelPattern('businesses:detail:*');

        const populated = await businessModel.findById(response._id).populate({
            path: 'userId',
            select: 'firstName lastName profilePhoto phoneNumber village currentCity familyMembers'
        });
        const formatted = formatBusinessDoc(populated);

        return responseSuccess(res, responseMessage.addDataSuccess('Business'), formatted);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const updateBusiness = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        const { id } = req.params;
        const body = req.body || {};

        const business = await businessModel.findOne({ _id: isValidObjectId(id), isDeleted: false });
        if (!business) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound('Business'));
        }

        // Only owner can update
        if (String(business.userId) !== String(user._id)) {
            return responseError(res, HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied);
        }

        // If changing familyMemberId, verify it belongs to user
        if (body.familyMemberId) {
            const member = (user.familyMembers || []).find(
                (m: any) => String(m._id) === String(body.familyMemberId)
            );
            if (!member) {
                return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound('Family member'));
            }
        }

        const updated = await businessModel.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true }
        ).populate({
            path: 'userId',
            select: 'firstName lastName profilePhoto phoneNumber village currentCity familyMembers'
        });

        await redisDelPattern('businesses:list:*');
        await redisDelPattern('businesses:detail:*');

        const formatted = formatBusinessDoc(updated);
        return responseSuccess(res, responseMessage.updateDataSuccess('Business'), formatted);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const deleteBusiness = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        const { id } = req.params;

        const business = await businessModel.findOne({ _id: isValidObjectId(id), isDeleted: false });
        if (!business) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound('Business'));
        }

        // Only owner or admin can delete
        if (user.role !== USER_ROLES.ADMIN && String(business.userId) !== String(user._id)) {
            return responseError(res, HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied);
        }

        await businessModel.findByIdAndUpdate(id, { isDeleted: true });

        await redisDelPattern('businesses:list:*');
        await redisDelPattern('businesses:detail:*');

        return responseSuccess(res, responseMessage.deleteDataSuccess('Business'));
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const getMyBusinesses = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;

        const results = await businessModel.find({
            userId: user._id,
            isDeleted: false
        }).populate({
            path: 'userId',
            select: 'firstName lastName profilePhoto phoneNumber village currentCity familyMembers'
        }).sort({ businessName: 1 });

        const formatted = results.map(formatBusinessDoc).filter(Boolean);
        return responseSuccess(res, responseMessage.getDataSuccess('My businesses'), formatted);
    } catch (error) {
        return internalServerError(res, error);
    }
};
