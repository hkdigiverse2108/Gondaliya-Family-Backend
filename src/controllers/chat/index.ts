import { chatModel } from '../../database';
import { HTTP_STATUS, isValidObjectId, resolvePagination, responseSuccess, responseError, internalServerError, USER_ROLES } from '../../common';
import { reqInfo, responseMessage, createData, updateData, getData, countData, redisIncr, findOneAndPopulate, findAllWithPopulate, Io, redisGet, redisSet, redisDelPattern } from '../../helper';
import moment from 'moment-timezone';

const TIMEZONE = 'Asia/Calcutta';

// File size limits in bytes
const SIZE_LIMITS = {
    TEXT: 0,
    IMAGE: 5 * 1024 * 1024,      // 5 MB
    VIDEO: 50 * 1024 * 1024,     // 50 MB
    FILE: 10 * 1024 * 1024       // 10 MB
};

export const sendMessage = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        const { message, mediaUrl, mediaType, fileSize } = req.body;

        const actualType = mediaType || 'TEXT';

        if (!message && !mediaUrl) {
            return responseError(res, HTTP_STATUS.BAD_REQUEST, "Message text or media is required!");
        }

        if (actualType !== 'TEXT' && fileSize) {
            const limit = SIZE_LIMITS[actualType];
            if (limit && fileSize > limit) {
                return responseError(res, HTTP_STATUS.BAD_REQUEST, `File size exceeds the limit of ${limit / (1024 * 1024)}MB for ${actualType}s!`);
            }
        }

        const todayStr = moment().tz(TIMEZONE).format('YYYY-MM-DD');
        const rateLimitKey = `chat:count:${user._id}:${todayStr}`;

        const currentCount = await redisIncr(rateLimitKey, 24 * 3600);
        if (currentCount > 32) {
            return responseError(res, HTTP_STATUS.TOO_MANY_REQUESTS, "Daily message limit (32 messages) exceeded!");
        }

        const chat = await createData(chatModel, {
            senderId: user._id,
            message: message || null,
            mediaUrl: mediaUrl || null,
            mediaType: actualType,
            fileSize: fileSize || 0
        });

        if (!chat) {
            return responseError(res, HTTP_STATUS.BAD_REQUEST, responseMessage.addDataError);
        }

        const populatedChat = await findOneAndPopulate(
            chatModel,
            { _id: chat._id },
            {},
            {},
            { path: 'senderId', select: 'firstName lastName profilePhoto' }
        );

        await redisDelPattern('chats:list:*');

        if (Io) {
            Io.to('general-chat').emit('chat:message', populatedChat);
        }

        return responseSuccess(res, responseMessage.addDataSuccess("Message"), populatedChat);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const getChats = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        const { page, limit, my } = req.query || {};

        const cacheKey = `chats:list:${JSON.stringify(req.query)}:${user?._id || 'guest'}`;
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
            return responseSuccess(res, responseMessage.getDataSuccess(my === 'true' ? "My messages" : "Messages"), JSON.parse(cachedData));
        }

        let criteria: any = { isDeleted: false };

        if (my === 'true') {
            criteria.senderId = user._id;
        } else {
            criteria.isBlocked = false;
        }

        const totalCount = await countData(chatModel, criteria);
        const { skip, limit: limitValue, hasLimit } = resolvePagination(page, limit, totalCount);

        const options: any = {
            sort: { createdAt: -1 as any }
        };
        if (hasLimit) {
            options.skip = skip;
            options.limit = limitValue;
        }

        const messages = await findAllWithPopulate(
            chatModel,
            criteria,
            {},
            options,
            { path: 'senderId', select: 'firstName lastName profilePhoto' }
        );

        messages.reverse();

        const stateObj = resolvePagination(page, limit, totalCount);

        const result = {
            data: messages,
            totalData: totalCount,
            state: stateObj
        };

        await redisSet(cacheKey, JSON.stringify(result), 600);

        return responseSuccess(res, responseMessage.getDataSuccess(my === 'true' ? "My messages" : "Messages"), result);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const deleteChat = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        if (user.role !== USER_ROLES.ADMIN) {
            return responseError(res, HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied);
        }

        const { id } = req.params;

        const deleted = await updateData(chatModel, { _id: isValidObjectId(id), isDeleted: false }, { isDeleted: true, deletedBy: user._id }, {});
        if (!deleted) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Message"));
        }

        await redisDelPattern('chats:list:*');

        if (Io) {
            Io.to('general-chat').emit('chat:removed', { id });
        }

        return responseSuccess(res, responseMessage.deleteDataSuccess("Message"));
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const blockChat = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        if (user.role !== USER_ROLES.ADMIN) {
            return responseError(res, HTTP_STATUS.FORBIDDEN, responseMessage.accessDenied);
        }

        const { id, chatId } = req.body;
        const targetId = chatId || id;

        const blocked = await updateData(chatModel, { _id: isValidObjectId(targetId), isDeleted: false }, { isBlocked: true }, {});
        if (!blocked) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, responseMessage.getDataNotFound("Message"));
        }

        await redisDelPattern('chats:list:*');

        if (Io) {
            Io.to('general-chat').emit('chat:blocked', { id: targetId });
        }

        return responseSuccess(res, responseMessage.updateDataSuccess("Message block status"));
    } catch (error) {
        return internalServerError(res, error);
    }
};
