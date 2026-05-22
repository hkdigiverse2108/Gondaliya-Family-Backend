import { listingModel } from '../../database';
import { HTTP_STATUS, isValidObjectId, resolvePagination, responseSuccess, responseError, internalServerError, USER_ROLES } from '../../common';
import { reqInfo, responseMessage, createData, updateData, getFirstMatch, countData, getData, findAllWithPopulate, findOneAndPopulate, redisGet, redisSet, redisDel, redisDelPattern } from '../../helper';

export const createListing = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        const body = req.body || {};
        body.postedBy = user._id;

        const listing = await createData(listingModel, body);

        if (!listing) return responseError(res, HTTP_STATUS.BAD_REQUEST, responseMessage.addDataError);

        await redisDelPattern('listings:list:*');

        return responseSuccess(res, responseMessage.addDataSuccess("Listing"), listing);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const getListings = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        const { page, limit, type, city, search, my } = req.query || {};

        const cacheKey = `listings:list:${JSON.stringify(req.query)}:${user?._id || 'guest'}`;
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
            return responseSuccess(res, responseMessage.getDataSuccess(my === 'true' ? "My Listings" : "Listings"), JSON.parse(cachedData));
        }

        let criteria: any = { isDeleted: false };

        if (my === 'true') {
            criteria.postedBy = user._id;
        } else {
            criteria.status = 'ACTIVE';
        }

        if (type) criteria.type = type;
        if (city) criteria['location.city'] = { $regex: `^${city.trim()}$`, $options: 'i' };

        if (search) {
            const regex = { $regex: search.trim(), $options: 'i' };
            criteria.$or = [
                { title: regex },
                { description: regex },
                { 'location.city': regex }
            ];
        }

        const totalCount = await countData(listingModel, criteria);
        const { skip, limit: limitValue, hasLimit } = resolvePagination(page, limit, totalCount);

        const options: any = {
            sort: { createdAt: -1 as any }
        };
        if (hasLimit) {
            options.skip = skip;
            options.limit = limitValue;
        }

        const listings = await findAllWithPopulate(
            listingModel,
            criteria,
            {},
            options,
            { path: 'postedBy', select: 'firstName lastName phoneNumber profilePhoto' }
        );

        const stateObj = resolvePagination(page, limit, totalCount);

        const result = {
            data: listings,
            totalData: totalCount,
            state: stateObj
        };

        await redisSet(cacheKey, JSON.stringify(result), 600);

        return responseSuccess(res, responseMessage.getDataSuccess(my === 'true' ? "My Listings" : "Listings"), result);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const getListingById = async (req, res) => {
    reqInfo(req);
    try {
        const { id } = req.params;

        const cacheKey = `listings:detail:${id}`;
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
            return responseSuccess(res, responseMessage.getDataSuccess("Listing details"), JSON.parse(cachedData));
        }

        const listing = await findOneAndPopulate(
            listingModel,
            { _id: isValidObjectId(id), isDeleted: false },
            {},
            {},
            { path: 'postedBy', select: 'firstName lastName phoneNumber profilePhoto workDetails' }
        );

        if (!listing) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Listing"));
        }

        await redisSet(cacheKey, JSON.stringify(listing), 600);

        return responseSuccess(res, responseMessage.getDataSuccess("Listing details"), listing);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const updateListing = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        const {
            listingId,
            id,
            type,
            title,
            description,
            photos,
            price,
            priceUnit,
            availableFrom,
            availableTo,
            location,
            contactPhone,
            status
        } = req.body || {};
        const targetId = listingId || id;

        const existing = await getFirstMatch(listingModel, { _id: isValidObjectId(targetId), isDeleted: false }, {}, {});
        if (!existing) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Listing"));
        }

        // Only owner can edit
        if (String(existing.postedBy) !== String(user._id)) {
            return responseError(res, HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied);
        }

        const updateFields: any = {};
        if (type !== undefined) updateFields.type = type;
        if (title !== undefined) updateFields.title = title;
        if (description !== undefined) updateFields.description = description;
        if (photos !== undefined) updateFields.photos = photos;
        if (price !== undefined) updateFields.price = price;
        if (priceUnit !== undefined) updateFields.priceUnit = priceUnit;
        if (availableFrom !== undefined) updateFields.availableFrom = availableFrom;
        if (availableTo !== undefined) updateFields.availableTo = availableTo;
        if (location !== undefined) updateFields.location = location;
        if (contactPhone !== undefined) updateFields.contactPhone = contactPhone;
        if (status !== undefined) updateFields.status = status;

        const updated = await updateData(listingModel, { _id: isValidObjectId(targetId) }, updateFields, {});

        await redisDelPattern('listings:list:*');
        await redisDel(`listings:detail:${targetId}`);

        return responseSuccess(res, responseMessage.updateDataSuccess("Listing"), updated);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const updateListingStatus = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        const { listingId, id, status } = req.body || {};
        const targetId = listingId || id;

        const existing = await getFirstMatch(listingModel, { _id: isValidObjectId(targetId), isDeleted: false }, {}, {});
        if (!existing) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Listing"));
        }

        if (String(existing.postedBy) !== String(user._id)) {
            return responseError(res, HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied);
        }

        const updated = await updateData(listingModel, { _id: isValidObjectId(targetId) }, { status }, {});

        await redisDelPattern('listings:list:*');
        await redisDel(`listings:detail:${targetId}`);

        return responseSuccess(res, responseMessage.updateDataSuccess("Listing status"), updated);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const deleteListing = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        const { id } = req.params;

        const existing = await getFirstMatch(listingModel, { _id: isValidObjectId(id), isDeleted: false }, {}, {});
        if (!existing) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Listing"));
        }

        // Only owner or admin can delete
        if (user.role !== USER_ROLES.ADMIN && String(existing.postedBy) !== String(user._id)) {
            return responseError(res, HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied);
        }

        await updateData(listingModel, { _id: isValidObjectId(id) }, { isDeleted: true }, {});

        await redisDelPattern('listings:list:*');
        await redisDel(`listings:detail:${id}`);

        return responseSuccess(res, responseMessage.deleteDataSuccess("Listing"));
    } catch (error) {
        return internalServerError(res, error);
    }
};
