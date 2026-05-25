import { userModel } from '../../database';
import { HTTP_STATUS, isValidObjectId, resolvePagination, responseSuccess, responseError, internalServerError } from '../../common';
import { reqInfo, responseMessage, getData, getFirstMatch, redisGet, redisSet } from '../../helper';

const USER_BUSINESS_PROJECTION = {
    firstName: 1,
    lastName: 1,
    profilePhoto: 1,
    phoneNumber: 1,
    village: 1,
    currentCity: 1,
    workDetails: 1,
    familyMembers: 1,
};

const hasBusiness = (workDetails: any) =>
    workDetails?.hasOwnBusiness === true &&
    !!workDetails?.businessDetails?.businessName?.trim();

const formatBusinessEntry = (
    user: any,
    workDetails: any,
    source: 'head' | 'familyMember',
    familyMember?: any
) => {
    const bd = workDetails.businessDetails;
    const ownerPhone =
        bd?.contactInfo?.mobile1 ||
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
            category: bd.category || null,
            subCategory: bd.subCategory || null,
            businessName: bd.businessName,
            ownerName: bd.ownerName || null,
            description: bd.description || null,
            locations: bd.locations || [],
            contactInfo: bd.contactInfo || {},
        },
    };
};

const matchesCity = (entry: any, city: string) => {
    const cityLower = city.trim().toLowerCase();
    const owner = entry.owner;
    if (owner.village?.toLowerCase() === cityLower) return true;
    if (owner.currentCity?.toLowerCase() === cityLower) return true;
    return (entry.business.locations || []).some(
        (loc: any) => loc?.areaCity?.toLowerCase() === cityLower
    );
};

const collectBusinessesFromUsers = (users: any[]) => {
    const entries: any[] = [];

    for (const user of users) {
        if (hasBusiness(user.workDetails)) {
            entries.push(formatBusinessEntry(user, user.workDetails, 'head'));
        }

        for (const member of user.familyMembers || []) {
            if (hasBusiness(member.workDetails)) {
                entries.push(formatBusinessEntry(user, member.workDetails, 'familyMember', member));
            }
        }
    }

    return entries;
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
            isActive: true,
            $or: [
                {
                    'workDetails.hasOwnBusiness': true,
                    'workDetails.businessDetails.businessName': { $nin: [null, ''] },
                },
                {
                    familyMembers: {
                        $elemMatch: {
                            'workDetails.hasOwnBusiness': true,
                            'workDetails.businessDetails.businessName': { $nin: [null, ''] },
                        },
                    },
                },
            ],
        };

        if (search) {
            const searchRegex = { $regex: search.trim(), $options: 'i' };
            criteria = {
                isDeleted: false,
                isActive: true,
                $and: [
                    { $or: criteria.$or },
                    {
                        $or: [
                            { 'workDetails.businessDetails.businessName': searchRegex },
                            { 'workDetails.businessDetails.category': searchRegex },
                            { 'workDetails.businessDetails.subCategory': searchRegex },
                            { 'workDetails.businessDetails.description': searchRegex },
                            { 'workDetails.businessDetails.ownerName': searchRegex },
                            { firstName: searchRegex },
                            { lastName: searchRegex },
                            { 'familyMembers.workDetails.businessDetails.businessName': searchRegex },
                            { 'familyMembers.workDetails.businessDetails.category': searchRegex },
                            { 'familyMembers.workDetails.businessDetails.subCategory': searchRegex },
                            { 'familyMembers.firstName': searchRegex },
                            { 'familyMembers.lastName': searchRegex },
                        ],
                    },
                ],
            };
        }

        const users = await getData(userModel, criteria, USER_BUSINESS_PROJECTION, { sort: { firstName: 1 } });

        let businesses = collectBusinessesFromUsers(users);

        if (category) {
            const cat = category.trim().toLowerCase();
            businesses = businesses.filter(
                (b) => b.business.category?.toLowerCase() === cat
            );
        }

        if (subCategory) {
            const sub = subCategory.trim().toLowerCase();
            businesses = businesses.filter(
                (b) => b.business.subCategory?.toLowerCase() === sub
            );
        }

        if (city) {
            businesses = businesses.filter((b) => matchesCity(b, city));
        }

        businesses.sort((a, b) =>
            (a.business.businessName || '').localeCompare(b.business.businessName || '')
        );

        const totalCount = businesses.length;
        const { skip, limit: limitValue, hasLimit } = resolvePagination(page, limit, totalCount);

        const pagedData = hasLimit ? businesses.slice(skip, skip + limitValue) : businesses;
        const stateObj = resolvePagination(page, limit, totalCount);

        const result = {
            data: pagedData,
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

        const user = await getFirstMatch(
            userModel,
            { _id: isValidObjectId(id), isDeleted: false, isActive: true },
            USER_BUSINESS_PROJECTION,
            {}
        );

        if (!user) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound('Business'));
        }

        let entry;

        if (familyMemberId) {
            const member = (user.familyMembers || []).find(
                (m: any) => String(m._id) === String(familyMemberId)
            );
            if (!member || !hasBusiness(member.workDetails)) {
                return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound('Business'));
            }
            entry = formatBusinessEntry(user, member.workDetails, 'familyMember', member);
        } else {
            if (!hasBusiness(user.workDetails)) {
                return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound('Business'));
            }
            entry = formatBusinessEntry(user, user.workDetails, 'head');
        }

        await redisSet(cacheKey, JSON.stringify(entry), 600);

        return responseSuccess(res, responseMessage.getDataSuccess('Business details'), entry);
    } catch (error) {
        return internalServerError(res, error);
    }
};
