const socketIo = require('socket.io');

let io;

module.exports = {
    init: (httpServer) => {
        io = socketIo(httpServer, {
            cors: {
                origin: 'http://localhost:3000'
            }
        });
        return io;
    },
    getIo: () => {
        if (!io) {
            throw new Error("Socket not initialized.");
        }
        return io;
    }
}