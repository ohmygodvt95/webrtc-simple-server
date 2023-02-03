var app = require('express')();
var cors = require('cors');
var server = require('http').Server(app);
var io = require('socket.io')(server, { origins: '*:*' });
const PORT = process.env.PORT || 3000
app.use(cors())

var room = {};

server.listen(PORT);
// WARNING: app.listen(80) will NOT work here!
console.log(`Web listen on PORT=${PORT}`);
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {
    console.log(socket.id + ' had connected')
    console.log(room)

    socket.on('message', data => {
        data = JSON.parse(data)
        if (!room[data.room]) {
            room[data.room] = [socket.id]
        } else if (room[data.room].length < 2) {
            if (room[data.room].filter(i => i === socket.id).length === 0) {
                room[data.room].push(socket.id)
            }
        }
        if (room[data.room].length === 2) {
            for (s of room[data.room]) {
                if (s !== socket.id && io.sockets.sockets[s] && room[data.room].length <= 2) {
                    io.sockets.sockets[s].emit('message', data.data)
                }
            }
        }
    })

    socket.on('join', (roomId) => {
        console.log('join' + roomId)
        if (room[roomId] && room[roomId].length === 2) {
            socket.emit('reject', { error: 'Room is full' })
        }
    })

    socket.on('leave', (roomId) => {
        console.log('leave' + roomId)
        for (s in room) {
            for (let i = 0; i < room[s].length; i++) {
                if (room[s][i] === roomId) {
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
