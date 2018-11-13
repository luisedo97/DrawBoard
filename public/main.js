const socket = io();

function $(id) {
    return document.getElementById(id);
}

function c(clase) {
    return document.getElementsByClassName(clase);
}

const draw = function() {
    let canvas = $('canvas'),
        colors = c('color'),
        ctx = canvas.getContext('2d'),
        stop = true,
        size = 3,
        color,x,y;

    for (var i = 0; i < colors.length; i++) {
        colors[i].addEventListener('click', colorUpdate, false);
    }

    function draw(firstX, firstY, nextX, nextY, color, size) {
        ctx.beginPath();
        ctx.moveTo(firstX, firstY);
        ctx.lineTo(nextX, nextY);
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.stroke();
        ctx.closePath();
        ctx.shadowBlur = 2000000;
        ctx.shadowColor = color;
    }

    function sendDrawing(firstX, firstY, nextX, nextY, color, size){
        socket.emit('drawing', {
            x0: firstX,
            y0: firstY,
            x1: nextX,
            y1: nextY,
            color: color,
            size: size
        });
    }
    
    function isPressed(e) {
        stop = false;
        x = e.clientX;
        y = e.clientY;
    }

    function isOut(e) {
        if (stop) { return; }
        stop = true;
        draw(x, y, e.clientX, e.clientY, color, size);
        sendDrawing(x, y, e.clientX, e.clientY, color, size);
    }

    function isMoving(e) {
        if (stop) { return; }
        draw(x, y, e.clientX, e.clientY, color,size);
        sendDrawing(x, y, e.clientX, e.clientY, color,size);
        x = e.clientX;
        y = e.clientY;
    }

    function colorUpdate(e) {
        color = e.target.className.split(' ')[3]; //cambiar.
    }

    function sizeUpdate(e){
        size = e.target.id;
    }

    function getDrawing(data) {
        draw(data.x0, data.y0, data.x1, data.y1, data.color, data.size);
    }

    function Resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    canvas.addEventListener('mousedown', isPressed);
    canvas.addEventListener('mouseup', isOut);
    canvas.addEventListener('mouseout', isOut);
    canvas.addEventListener('mousemove', isMoving);
    socket.on('drawing', getDrawing);
    Resize();
}

let user;
let listUsername = [];

const message = function() {
    let message = $('message'),
        username = $('username'),
        btnEnter = $('enter'),
        output = $('output'),
        actions = $('actions'),
        listUser = $('listUser');
        chatWindows = $('chat-window');

    function sentMessage() {
        socket.emit('chat message', {
            message: message.value,
            username: username.value
        });
        message.value="";
        chatWindows.scrollTop = chatWindows.scrollHeight;
    }

    function sentTyping(event) {
        socket.emit('chat typing', username.value);
        if (event.keyCode === 13){
            sentMessage();
        }
    }

    function getMessage(data) {
        actions.innerHTML = '';
        let p = document.createElement('p');
        let strong = document.createElement('strong');
        strong.innerHTML = data.username;
        p.appendChild(strong);
        p.innerHTML += ": " + data.message;
        output.appendChild(p);
        chatWindows.scrollTop = chatWindows.scrollHeight;
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
        $('intro').hidden = true;
        $('all').hidden = false;
    }

    function getListUser(data){
        listUsername = data;
        listUser.innerText = "List of connected users:";
        listUsername.forEach(element => {
            listUser.innerText += "\n-"+element.username;
        });
    }

    btnEnter.addEventListener('click',setUsername,false);
    //btnSend.addEventListener('click', sentMessage, false);
    message.addEventListener('keypress', sentTyping, false);
    socket.on('chat message', getMessage);
    socket.on('chat typing', getTyping);
    socket.on('new user',getListUser);
}

window.onunload = ()=>{
    if(user!=null)
        socket.emit('disconnected');
}

message();
draw();