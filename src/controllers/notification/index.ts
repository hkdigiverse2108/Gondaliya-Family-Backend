import { notificationModel } from '../../database';
import { responseSuccess, internalServerError } from '../../common';
import { reqInfo, responseMessage, updateMany, getData, redisGet, redisSet, redisDelPattern } from '../../helper';

export const getNotifications = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;

        const cacheKey = `notifications:list:${user?._id}`;
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
            return responseSuccess(res, responseMessage.getDataSuccess("Notifications"), JSON.parse(cachedData));
        }

        const options = {
            sort: { createdAt: -1 as any },
            limit: 50
        };
        const notifications = await getData(notificationModel, { userId: user._id }, {}, options);

        await redisSet(cacheKey, JSON.stringify(notifications), 600);

        return responseSuccess(res, responseMessage.getDataSuccess("Notifications"), notifications);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const readAllNotifications = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;

        await updateMany(notificationModel, { userId: user._id, isRead: false }, { isRead: true }, {});

        await redisDelPattern(`notifications:list:${user?._id}`);

        return responseSuccess(res, "All notifications successfully marked as read!");
    } catch (error) {
        return internalServerError(res, error);
    }
};
