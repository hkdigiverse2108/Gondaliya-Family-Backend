import { locationModel } from '../../database';
import { HTTP_STATUS, isValidObjectId, resolvePagination, resolveSortAndFilter, responseSuccess, responseError, internalServerError } from '../../common';
import { reqInfo, responseMessage, updateData, getFirstMatch, createData, getDataWithSorting, countData, redisGet, redisSet, redisDelPattern } from '../../helper';

export const createLocation = async (req, res) => {
    reqInfo(req);
    try {
        const { village, taluka, district, pincode } = req.body;

        const existing = await getFirstMatch(locationModel, {
            village: { $regex: `^${village?.trim() || ''}$`, $options: 'si' },
            taluka: { $regex: `^${taluka?.trim() || ''}$`, $options: 'si' },
            district: { $regex: `^${district?.trim() || ''}$`, $options: 'si' },
            pincode: pincode?.trim() || '',
            isDeleted: false
        }, {}, {});

        if (existing) {
            return responseError(res, HTTP_STATUS.CONFLICT, "This Location already exists in the master list!");
        }

        const newLocation = await createData(locationModel, {
            village: village?.trim() || '',
            taluka: taluka?.trim() || '',
            district: district?.trim() || '',
            pincode: pincode?.trim() || ''
        });

        await redisDelPattern(`locations:*`);

        return responseSuccess(res, "Location successfully added to the master list!", newLocation);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const updateLocation = async (req, res) => {
    reqInfo(req);
    try {
        const { id, village, taluka, district, pincode, isActive } = req.body;

        const updateFields: any = {};
        if (village !== undefined) updateFields.village = village.trim();
        if (taluka !== undefined) updateFields.taluka = taluka.trim();
        if (district !== undefined) updateFields.district = district.trim();
        if (pincode !== undefined) updateFields.pincode = pincode.trim();
        if (isActive !== undefined) updateFields.isActive = isActive;

        const updated = await updateData(locationModel, { _id: isValidObjectId(id), isDeleted: false }, updateFields, {});
        if (!updated) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, "Location not found!");
        }

        await redisDelPattern(`locations:*`);

        return responseSuccess(res, "Location updated successfully!", updated);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const deleteLocation = async (req, res) => {
    reqInfo(req);
    try {
        const { id } = req.params;

        const deleted = await updateData(locationModel, { _id: isValidObjectId(id), isDeleted: false }, { isDeleted: true }, {});
        if (!deleted) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, "Location not found!");
        }

        await redisDelPattern(`locations:*`);

        return responseSuccess(res, "Location deleted successfully!");
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const getLocations = async (req, res) => {
    reqInfo(req);
    try {
        const cacheKey = `locations:list:${JSON.stringify(req.query)}`;
        const cachedData = await redisGet(cacheKey);

        if (cachedData) {
            return responseSuccess(res, responseMessage.getDataSuccess("Locations"), JSON.parse(cachedData));
        }

        let { criteria, options, page, limit } = resolveSortAndFilter(req.query || {}, ['village', 'taluka', 'district', 'pincode']);

        if (req.query.activeFilter === undefined) {
            criteria.isActive = true;
        }

        const data = await getDataWithSorting(locationModel, criteria, {}, options);
        const totalCount = await countData(locationModel, criteria);
        const stateObj = await resolvePagination(page, limit, totalCount);

        const result = {
            data,
            totalData: totalCount,
            state: stateObj
        };

        await redisSet(cacheKey, JSON.stringify(result), 600);

        return responseSuccess(res, responseMessage.getDataSuccess("Locations"), result);
    } catch (error) {
        return internalServerError(res, error);
    }
};
