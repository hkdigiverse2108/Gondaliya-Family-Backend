import { announcementModel, userModel } from '../../database';
import { HTTP_STATUS, isValidObjectId, resolvePagination, resolveSortAndFilter, responseSuccess, responseError, internalServerError, USER_ROLES, NOTIFICATION_TYPES } from '../../common';
import { reqInfo, responseMessage, updateData, getFirstMatch, createData, getDataWithSorting, countData, redisDelPattern, redisGet, redisSet, getData, dispatchNotificationToUsers } from '../../helper';

export const createAnnouncement = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        if (user.role !== USER_ROLES.ADMIN) {
            return responseError(res, HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied);
        }

        const { title, description, imageUrl } = req.body;

        const announcement = await createData(announcementModel, {
            title,
            description,
            imageUrl: imageUrl || null,
            createdBy: user._id
        });

        if (!announcement) {
            return responseError(res, HTTP_STATUS.BAD_REQUEST, responseMessage.addDataError);
        }

        await redisDelPattern('announcements:list:*');

        const activeUsers = await getData(userModel, { isDeleted: false, isActive: true, role: { $ne: USER_ROLES.ADMIN } }, { _id: 1, deviceToken: 1 }, {});

        if (activeUsers.length > 0) {
            await dispatchNotificationToUsers(activeUsers, {
                title: 'New Announcement',
                body: title,
                type: NOTIFICATION_TYPES.ANNOUNCEMENT,
                refId: String(announcement._id),
            });
        }

        return responseSuccess(res, responseMessage.addDataSuccess("Announcement"), announcement);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const getAnnouncements = async (req, res) => {
    reqInfo(req);
    try {
        const cacheKey = `announcements:list:${JSON.stringify(req.query)}`;
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
            return responseSuccess(res, responseMessage.getDataSuccess("Announcements"), JSON.parse(cachedData));
        }

        let { page, limit, search } = req.query || {};
        let criteria: any = { isDeleted: false, isActive: true };

        if (search) {
            criteria.$or = [
                { title: { $regex: search, $options: 'si' } },
                { description: { $regex: search, $options: 'si' } }
            ];
        }

        const totalCount = await countData(announcementModel, criteria);
        const { skip, limit: limitValue, hasLimit } = resolvePagination(page, limit, totalCount);

        const options: any = {
            sort: { createdAt: -1 },
            lean: true
        };
        if (hasLimit) {
            options.skip = skip;
            options.limit = limitValue;
        }

        const data = await getDataWithSorting(announcementModel, criteria, {}, options);
        const stateObj = resolvePagination(page, limit, totalCount);

        const result = {
            data,
            totalData: totalCount,
            state: stateObj
        };

        await redisSet(cacheKey, JSON.stringify(result), 600);

        return responseSuccess(res, responseMessage.getDataSuccess("Announcements"), result);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const updateAnnouncement = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        if (user.role !== USER_ROLES.ADMIN) {
            return responseError(res, HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied);
        }

        const { announcementId, id, title, description, imageUrl, isActive } = req.body;
        const targetId = announcementId || id;

        const updateFields: any = {};
        if (title !== undefined) updateFields.title = title;
        if (description !== undefined) updateFields.description = description;
        if (imageUrl !== undefined) updateFields.imageUrl = imageUrl;
        if (isActive !== undefined) updateFields.isActive = isActive;

        const updated = await updateData(announcementModel, { _id: isValidObjectId(targetId), isDeleted: false }, updateFields, {});
        if (!updated) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Announcement"));
        }

        await redisDelPattern('announcements:list:*');

        return responseSuccess(res, responseMessage.updateDataSuccess("Announcement"), updated);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const deleteAnnouncement = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        if (user.role !== USER_ROLES.ADMIN) {
            return responseError(res, HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied);
        }

        const { id } = req.params;

        const deleted = await updateData(announcementModel, { _id: isValidObjectId(id), isDeleted: false }, { isDeleted: true }, {});
        if (!deleted) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Announcement"));
        }

        await redisDelPattern('announcements:list:*');

        return responseSuccess(res, responseMessage.deleteDataSuccess("Announcement"));
    } catch (error) {
        return internalServerError(res, error);
    }
};
