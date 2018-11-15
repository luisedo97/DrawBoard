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
var random = 0;

function onConnection(socket) {
    socket.on('drawing', (data) => socket.broadcast.emit('drawing', data));
    socket.on('chat message', (data) => { io.sockets.emit('chat message', data)});
    socket.on('chat typing', (data) => { socket.broadcast.emit('chat typing', data) });
    socket.on('register user',(data)=>{
        
        if(data.trim()==''){
            data = "Guest"+random;
            random++;
            socket.emit('not name',data);    
        }
        listUsername.push({
            id:socket.id,
            username:data,
            color:"black"
        });
        console.log(data);
        io.sockets.emit('new user',listUsername);   
    });
    socket.on('disconnected',(data)=>{
        let i;
        listUsername.forEach((element)=>{
            if(element.id == socket.id){
                listUsername.splice(i,1);                
            }
            i++;
        })
        socket.broadcast.emit('new user', listUsername);
    });
    socket.on('change color',(data)=>{
        listUsername.forEach(element=>{
            console.log(data);
            if(element.id == socket.id){
                element.color = data;
            }
        });
        io.sockets.emit("new user",listUsername);
    });

}

io.on('connection', onConnection);