const socket = io();

function $(id) {
    return document.getElementById(id);
}

function c(clase) {
    return document.getElementsByClassName(clase);
}

const draw = function() {
    let canvas = c('whiteboard')[0],
        colors = c('color'),
        context = canvas.getContext('2d'),
        drawing = false,
        current = { color: 'black' };

    for (var i = 0; i < colors.length; i++) {
        colors[i].addEventListener('click', colorUpdate, false);
    }

    function drawLine(x0, y0, x1, y1, color, emit) {
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.stroke();
        context.closePath();

        if (!emit) { return; }
        var w = canvas.width;
        var h = canvas.height;

        socket.emit('drawing', {
            x0: x0 / w,
            y0: y0 / h,
            x1: x1 / w,
            y1: y1 / h,
            color: color
        });
    }

    function isPressed(e) {
        drawing = true;
        current.x = e.clientX;
        current.y = e.clientY;
    }

    function isOut(e) {
        if (!drawing) { return; }
        drawing = false;
        drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
    }

    function isMoving(e) {
        if (!drawing) { return; }
        drawLine(current.x, current.y, e.clientX, e.clientY, current.color, true);
        current.x = e.clientX;
        current.y = e.clientY;
    }

    function colorUpdate(e) {
        current.color = e.target.className.split(' ')[1]; //cambiar. Hace falta el front.
    }

    function Drawing(data) {
        var w = canvas.width;
        var h = canvas.height;
        drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
    }

    function onResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    canvas.addEventListener('mousedown', isPressed, false);
    canvas.addEventListener('mouseup', isOut, false);
    canvas.addEventListener('mouseout', isOut, false);
    canvas.addEventListener('mousemove', isMoving, false);
    window.addEventListener('resize', onResize, false);
    socket.on('drawing', Drawing);
    onResize();
}

var user;
var listUsername = [];

const message = function() {
    let message = $('message'),
        username = $('username'),
        btnEnter = $('enter'),
        btnSend = $('send'),
        output = $('output'),
        actions = $('actions'),
        listUser = $('listUser');


    function sentMessage() {
        socket.emit('chat message', {
            message: message.value,
            username: username.value
        });
    }

    function sentTyping() {
        socket.emit('chat typing', username.value);
    }

    function getMessage(data) {
        actions.innerHTML = '';
        let p = document.createElement('p');
        let strong = document.createElement('strong');
        strong.innerHTML = data.username;
        p.appendChild(strong);
        p.innerHTML += ": " + data.message;
        output.appendChild(p);
    }

    function getTyping(data) {
        let p = document.createElement('p');
        let em = document.createElement('em');
        em.innerHTML = data + " is typing...";
        p.appendChild(em);
        console.log(p);
        actions.innerHTML = p.innerHTML;
    }

    function setUsername(){
        user = username.value;
        socket.emit('register user',user);
        $('message-container').hidden = false;
        $('name-container').hidden = true;
    }

    function getListUser(data){
        listUsername = data;
        listUser.innerHTML = listUsername;
        console.log(listUsername);
    }

    btnEnter.addEventListener('click',setUsername,false);
    btnSend.addEventListener('click', sentMessage, false);
    message.addEventListener('keypress', sentTyping, false);
    socket.on('chat message', getMessage);
    socket.on('chat typing', getTyping);
    socket.on('new user',getListUser);
}

window.onunload = ()=>{
    if(user!=null)
        socket.emit('disconnected',user);
}

message();
draw();