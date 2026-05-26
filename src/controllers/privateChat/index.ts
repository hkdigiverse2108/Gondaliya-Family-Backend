import { privateConversationModel, privateMessageModel, userModel } from '../../database';
import { HTTP_STATUS, isValidObjectId, resolvePagination, responseSuccess, responseError, internalServerError } from '../../common';
import { reqInfo, responseMessage, createData, updateData, updateMany, getFirstMatch, findAllWithPopulate, countData, redisGet, redisSet, redisDel } from '../../helper';

export const startConversation = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        const { receiverId } = req.body;

        if (user._id.toString() === receiverId) {
            return responseError(res, HTTP_STATUS.BAD_REQUEST, "You cannot start a conversation with yourself!");
        }

        const receiver = await getFirstMatch(userModel, { _id: isValidObjectId(receiverId), isDeleted: false }, {}, {});
        if (!receiver) {
            return responseError(res, HTTP_STATUS.NOT_FOUND, "Receiver user not found!");
        }

        let conversation = await getFirstMatch(
            privateConversationModel,
            {
                participants: { $all: [user._id, isValidObjectId(receiverId)] }
            },
            {},
            {}
        );

        if (conversation) {
            if (conversation.deletedBy && conversation.deletedBy.length > 0) {
                conversation = await updateData(
                    privateConversationModel,
                    { _id: conversation._id },
                    { $pull: { deletedBy: user._id } },
                    {}
                );
            }
        } else {
            conversation = await createData(privateConversationModel, {
                participants: [user._id, isValidObjectId(receiverId)],
                lastMessage: null,
                lastMessageAt: null,
                deletedBy: []
            });
        }

        await redisDel(`private_chat:conversations:${user._id.toString()}`);
        await redisDel(`private_chat:conversations:${receiverId}`);

        return responseSuccess(res, responseMessage.addDataSuccess("Conversation"), { conversationId: conversation._id });
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const getConversations = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;

        const cacheKey = `private_chat:conversations:${user._id.toString()}`;
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
            return responseSuccess(res, responseMessage.getDataSuccess("Conversations"), JSON.parse(cachedData));
        }

        const criteria = {
            participants: user._id,
            deletedBy: { $ne: user._id }
        };

        const conversations = await findAllWithPopulate(
            privateConversationModel,
            criteria,
            {},
            { sort: { lastMessageAt: -1 } },
            { path: 'participants', select: 'firstName lastName profilePhoto' }
        );

        const formattedConversations = await Promise.all(conversations.map(async (convo: any) => {
            const otherParticipant = convo.participants.find(
                (p: any) => p._id.toString() !== user._id.toString()
            );
            const unreadCount = await countData(privateMessageModel, {
                conversationId: convo._id,
                receiverId: user._id,
                isRead: false
            });
            return {
                _id: convo._id,
                participants: convo.participants,
                lastMessage: convo.lastMessage,
                lastMessageAt: convo.lastMessageAt,
                createdAt: convo.createdAt,
                updatedAt: convo.updatedAt,
                unreadCount: unreadCount || 0,
                otherParticipant: otherParticipant ? {
                    _id: otherParticipant._id,
                    name: `${otherParticipant.firstName} ${otherParticipant.lastName}`.trim(),
                    avatar: otherParticipant.profilePhoto
                } : null
            };
        }));

        await redisSet(cacheKey, JSON.stringify(formattedConversations), 600);

        return responseSuccess(res, responseMessage.getDataSuccess("Conversations"), formattedConversations);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const getMessages = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        const { conversationId } = req.params;
        const { page, limit } = req.query || {};

        const conversation = await getFirstMatch(
            privateConversationModel,
            { _id: isValidObjectId(conversationId), participants: user._id },
            {},
            {}
        );
        if (!conversation) {
            return responseError(res, HTTP_STATUS.FORBIDDEN, "You are not a participant in this conversation!");
        }

        const criteria = {
            conversationId: isValidObjectId(conversationId),
            deletedBy: { $ne: user._id }
        };

        const totalCount = await countData(privateMessageModel, criteria);
        const { skip, limit: limitValue, hasLimit } = resolvePagination(page, limit, totalCount);

        const options: any = {
            sort: { createdAt: -1 }
        };
        if (hasLimit) {
            options.skip = skip;
            options.limit = limitValue;
        }

        const messages = await findAllWithPopulate(
            privateMessageModel,
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

        return responseSuccess(res, responseMessage.getDataSuccess("Messages"), result);
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const markAsRead = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        const { conversationId } = req.params;

        const conversation = await getFirstMatch(
            privateConversationModel,
            { _id: isValidObjectId(conversationId), participants: user._id },
            {},
            {}
        );
        if (!conversation) {
            return responseError(res, HTTP_STATUS.FORBIDDEN, "You are not a participant in this conversation!");
        }

        await updateMany(
            privateMessageModel,
            {
                conversationId: isValidObjectId(conversationId),
                receiverId: user._id,
                isRead: false
            },
            { isRead: true },
            {}
        );

        await redisDel(`private_chat:conversations:${user._id.toString()}`);

        return responseSuccess(res, responseMessage.updateDataSuccess("Messages marked as read"));
    } catch (error) {
        return internalServerError(res, error);
    }
};

export const deleteConversation = async (req, res) => {
    reqInfo(req);
    try {
        const { user } = req.headers;
        const { conversationId } = req.params;

        const conversation = await getFirstMatch(
            privateConversationModel,
            { _id: isValidObjectId(conversationId), participants: user._id },
            {},
            {}
        );
        if (!conversation) {
            return responseError(res, HTTP_STATUS.FORBIDDEN, "You are not a participant in this conversation!");
        }

        await updateData(
            privateConversationModel,
            { _id: conversation._id },
            { $addToSet: { deletedBy: user._id } },
            {}
        );

        await updateMany(
            privateMessageModel,
            { conversationId: conversation._id },
            { $addToSet: { deletedBy: user._id } },
            {}
        );

        await redisDel(`private_chat:conversations:${user._id.toString()}`);

        return responseSuccess(res, responseMessage.deleteDataSuccess("Conversation"));
    } catch (error) {
        return internalServerError(res, error);
    }
};
