var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var room = {};

server.listen(3000);
// WARNING: app.listen(80) will NOT work here!

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    console.log(socket.id + ' had connected')

    socket.on('message', data => {
        data = JSON.parse(data)
        if (!room[data.room]) {
            room[data.room] = [socket.id]
        } else {
            if (room[data.room].filter(i => i === socket.id).length === 0) {
                room[data.room].push(socket.id)
            }
        }

        for (s of room[data.room]) {
            if (s !== socket.id && io.sockets.sockets[s]) {
                io.sockets.sockets[s].emit('message', data.data)
            }
        }
    })

    socket.on('join', (roomId) => {
        if (room[roomId] && room[roomId].length === 2) {
            socket.emit('reject', { error: 'Room is full' })
        }
    })

    socket.on('disconnect', () => {
        console.log(socket.id + ' has been disconnected')
        for (s in room) {
            for (let i = 0; i < room[s].length; i++) {
                if (room[s][i] === socket.id) {
                    room[s].splice(i, 1)
                    if (room[s].length == 0) {
                        delete room[s]
                    }
                    break
                }
            }
        }
        console.log(room)
    })
});