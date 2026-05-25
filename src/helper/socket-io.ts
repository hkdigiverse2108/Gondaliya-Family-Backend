import http from 'http';
import { Server, Socket } from 'socket.io';
import { verifyUserFromToken } from './jwt';
import { logger } from './winston-logger';

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

        socket.emit(CHAT_EVENTS.CONNECTED, {
            room: CHAT_ROOM,
            userId: user?._id,
            events: Object.values(CHAT_EVENTS).filter((e) => e !== CHAT_EVENTS.CONNECTED),
        });

        logger.info(`Chat socket connected: ${socket.id} user=${user?._id}`);

        socket.on('disconnect', (reason) => {
            logger.info(`Chat socket disconnected: ${socket.id} reason=${reason}`);
        });
    });

    io.engine.on('connection_error', (err: any) => {
        logger.warn(`Socket connection error: ${err?.message || err}`);
    });
};
