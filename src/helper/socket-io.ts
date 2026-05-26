import http from 'http';
import { Server, Socket } from 'socket.io';
import { verifyUserFromToken } from './jwt';
import { logger } from './winston-logger';
import { privateConversationModel, privateMessageModel, userModel } from '../database';
import { createData, updateData, getFirstMatch } from './database-service';
import { redisDel } from './redis';
import { isValidObjectId } from '../common';
import { notification_to_user } from './notification';

export const CHAT_ROOM = 'general-chat';

export const CHAT_EVENTS = {
    CONNECTED: 'chat:connected',
    MESSAGE: 'chat:message',
    REMOVED: 'chat:removed',
    BLOCKED: 'chat:blocked',
} as const;

export type ChatSocketEvent = typeof CHAT_EVENTS[keyof typeof CHAT_EVENTS];

export let Io: Server | undefined;

const getHandshakeToken = (socket: Socket): string => {
    const auth = socket.handshake.auth || {};
    const headers = socket.handshake.headers || {};

    const fromAuth =
        auth.token ||
        auth.authorization ||
        auth.accessToken;

    const fromHeader =
        headers.authorization ||
        headers.Authorization;

    return String(fromAuth || fromHeader || '');
};

const serializeForSocket = (payload: unknown) => {
    if (!payload) {
        return payload;
    }
    return JSON.parse(JSON.stringify(payload));
};

export const emitChatEvent = (event: ChatSocketEvent, payload: unknown) => {
    if (!Io) {
        logger.warn(`Socket.IO not ready; skipped ${event}`);
        return;
    }
    Io.to(CHAT_ROOM).emit(event, serializeForSocket(payload));
};

export const socketServer = (app) => {
    const server = new http.Server(app);

    const io = require('socket.io')(server, { cors: true })

    io.use(async (socket, next) => {
        try {
            const user = await verifyUserFromToken(getHandshakeToken(socket));
            socket.data.user = user;
            next();
        } catch (err: any) {
            next(new Error(err?.message || 'Unauthorized'));
        }
    });

    ioEvents(io);
    Io = io;
    logger.info('Socket.IO initialized for chat');
    return server;
};

const ioEvents = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        const user = socket.data.user;
        socket.join(CHAT_ROOM);
        if (user?._id) {
            socket.join(`user:${user._id.toString()}`);
            socket.join(`user_${user._id.toString()}`);
        }

        socket.emit(CHAT_EVENTS.CONNECTED, {
            room: CHAT_ROOM,
            userId: user?._id,
            events: Object.values(CHAT_EVENTS).filter((e) => e !== CHAT_EVENTS.CONNECTED),
        });

        logger.info(`Chat socket connected: ${socket.id} user=${user?._id}`);

        socket.on('join_private_room', async (data: { conversationId: string }) => {
            try {
                const { conversationId } = data || {};
                const userId = socket.data.user?._id;
                if (!userId || !conversationId) return;

                const convo = await getFirstMatch(privateConversationModel, {
                    _id: isValidObjectId(conversationId),
                    participants: userId
                }, {}, {});

                if (convo) {
                    socket.join(`private:${conversationId}`);
                    socket.join(`private_${conversationId}`);
                    logger.info(`User ${userId} joined private room private_${conversationId}`);
                } else {
                    logger.warn(`User ${userId} attempted to join private room private_${conversationId} but is not a participant`);
                }
            } catch (err) {
                logger.error(`Error joining private room: ${err}`);
            }
        });

        socket.on('send_private_message', async (data: { conversationId: string, receiverId: string, message: string, messageType?: string, relatedListingId?: string }) => {
            try {
                const { conversationId, receiverId, message, messageType, relatedListingId } = data || {};
                const senderId = socket.data.user?._id;
                if (!senderId || !conversationId || !receiverId) return;

                const convo = await getFirstMatch(privateConversationModel, {
                    _id: isValidObjectId(conversationId),
                    participants: senderId
                }, {}, {});

                if (!convo) {
                    logger.warn(`User ${senderId} attempted to send message to conversation ${conversationId} but is not a participant`);
                    return;
                }

                const privateMessage = await createData(privateMessageModel, {
                    conversationId: isValidObjectId(conversationId),
                    senderId,
                    receiverId: isValidObjectId(receiverId),
                    message,
                    messageType: messageType || 'text',
                    relatedListingId: relatedListingId ? isValidObjectId(relatedListingId) : null,
                    isRead: false,
                    deletedBy: []
                });

                await updateData(
                    privateConversationModel,
                    { _id: convo._id },
                    {
                        lastMessage: message,
                        lastMessageAt: new Date(),
                        deletedBy: []
                    },
                    {}
                );

                await redisDel(`private_chat:conversations:${senderId.toString()}`);
                await redisDel(`private_chat:conversations:${receiverId.toString()}`);

                const senderName = `${socket.data.user.firstName} ${socket.data.user.lastName}`.trim();
                const senderAvatar = socket.data.user.profilePhoto;

                const emitPayload = serializeForSocket({
                    _id: privateMessage._id,
                    conversationId: privateMessage.conversationId,
                    senderId: privateMessage.senderId,
                    receiverId: privateMessage.receiverId,
                    message: privateMessage.message,
                    messageType: privateMessage.messageType,
                    relatedListingId: privateMessage.relatedListingId,
                    isRead: privateMessage.isRead,
                    createdAt: privateMessage.createdAt,
                    sender: {
                        name: senderName,
                        avatar: senderAvatar
                    }
                });

                io.to(`private:${conversationId}`).emit('receive_private_message', emitPayload);
                io.to(`private_${conversationId}`).emit('receive_private_message', emitPayload);

                const notifPayload = serializeForSocket({
                    conversationId,
                    senderName,
                    message,
                    messageType: messageType || 'text',
                    sender: {
                        name: senderName,
                        avatar: senderAvatar
                    }
                });
                io.to(`user:${receiverId}`).emit('private_message_notification', notifPayload);
                io.to(`user_${receiverId}`).emit('private_message_notification', notifPayload);

                const receiver = await getFirstMatch(userModel, { _id: isValidObjectId(receiverId), isDeleted: false }, { deviceToken: 1 }, {});
                if (receiver && receiver.deviceToken && receiver.deviceToken.length > 0) {
                    notification_to_user(
                        receiver,
                        {
                            conversationId: conversationId.toString(),
                            type: 'private_chat'
                        },
                        {
                            title: senderName,
                            body: messageType === 'give' ? `[GIVE] ${message}` : messageType === 'take' ? `[TAKE] ${message}` : message
                        }
                    ).catch((err) => {
                        logger.error(`Error sending push notification for private message: ${err}`);
                    });
                }
            } catch (err) {
                logger.error(`Error in send_private_message handler: ${err}`);
            }
        });

        socket.on('disconnect', (reason) => {
            logger.info(`Chat socket disconnected: ${socket.id} reason=${reason}`);
        });
    });

    io.engine.on('connection_error', (err: any) => {
        logger.warn(`Socket connection error: ${err?.message || err}`);
    });
};
