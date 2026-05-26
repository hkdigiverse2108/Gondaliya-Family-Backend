import { notificationModel, userModel } from '../../database';
import { HTTP_STATUS, isValidObjectId, responseSuccess, responseError, internalServerError, USER_ROLES } from '../../common';
import {
    reqInfo,
    responseMessage,
    updateMany,
    getData,
    redisGet,
    redisSet,
    redisDelPattern,
    dispatchNotification,
    dispatchNotificationToUsers,
} from '../../helper';

export const createNotification = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        if (user.role !== USER_ROLES.ADMIN) {
            return responseError(res, HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied);
        }

        const { userId, userIds, broadcastToAll, title, body, type, refId, sendPush } = req.body || {};

        if (broadcastToAll) {
            const activeUsers = await getData(
                userModel,
                { isDeleted: false, isActive: true, role: { $ne: USER_ROLES.ADMIN } },
                { _id: 1, deviceToken: 1 },
                {}
            );

            const notifications = await dispatchNotificationToUsers(activeUsers, {
                title,
                body,
                type,
                refId,
                sendPush,
            });

            return responseSuccess(res, responseMessage.addDataSuccess('Notification'), {
                recipientCount: activeUsers.length,
                notifications,
            });
        }

        if (userIds?.length) {
            const objectIds = userIds.map((id: string) => isValidObjectId(id));
            const users = await getData(
                userModel,
                { _id: { $in: objectIds }, isDeleted: false },
                { _id: 1, deviceToken: 1 },
                {}
            );

            if (!users.length) {
                return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound('User'));
            }

            const notifications = await dispatchNotificationToUsers(users, {
                title,
                body,
                type,
                refId,
                sendPush,
            });

            return responseSuccess(res, responseMessage.addDataSuccess('Notification'), {
                recipientCount: users.length,
                notifications,
            });
        }

        const notification = await dispatchNotification({
            userId,
            title,
            body,
            type,
            refId,
            sendPush,
        });

        if (!notification) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound('User'));
        }

        return responseSuccess(res, responseMessage.addDataSuccess('Notification'), notification);
    } catch (error) {
        return internalServerError(res, error);
    }
};

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
