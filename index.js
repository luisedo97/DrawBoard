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

function chatActions(socket){
	socket.on('chat message', (data) => {
        io.sockets.emit('chat message', data)
    });
    socket.on('chat typing', (data) => {
        socket.broadcast.emit('chat typing', data);
    });
}

function onConnection(socket){
  socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
  	//chatActions(socket); hay que implementarrrrr
}

io.on('connection', onConnection);
