const express = require('express'),
    app = express(),
    path = require('path'),
    SocketIO = require('socket.io'),
    port = process.env.PORT || 3000;

app.set('port', port);

app.use(express.static(__dirname + '/public'));

const server = app.listen(app.get('port'), () =>
    console.log("Server listening on port", app.get('port'))
);

const io = SocketIO.listen(server);
var listUsername = [];


function onConnection(socket) {
    socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
    socket.on('chat message', (data) => { io.sockets.emit('chat message', data) });
    socket.on('chat typing', (data) => { socket.broadcast.emit('chat typing', data) });
    socket.on('register user',(data)=>{
        listUsername.push(data);
        socket.emit('new user',listUsername);
        socket.broadcast.emit('new user', listUsername);
    });
    socket.on('disconnected',(data)=>{
        let index = listUsername.indexOf(data);
        if(index>-1){
            listUsername.splice(index,1);
        }
        socket.broadcast.emit('new user', listUsername);
    });
}

io.on('connection', onConnection);