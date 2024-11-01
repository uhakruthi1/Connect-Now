// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
    socket.on('join', (roomId) => {
        socket.join(roomId);
    });

    socket.on('offer', (data) => {
        socket.to(data.roomId).emit('offer', data);
    });

    socket.on('answer', (data) => {
        socket.to(data.roomId).emit('answer', data);
    });

    socket.on('candidate', (data) => {
        socket.to(data.roomId).emit('candidate', data);
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
