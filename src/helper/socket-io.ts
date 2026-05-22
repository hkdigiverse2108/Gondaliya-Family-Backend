import http from 'http'

export let Io;

export const socketServer = (app) => {
    const server = new http.Server(app);
    const io = require('socket.io')(server, { cors: true })
    ioEvents(io);
    Io = io
    return server;
}

const ioEvents = (io) => {
    io.on('connection', (socket) => {
        socket.join('general-chat');

        socket.on('disconnect', () => {
        });
    });
}