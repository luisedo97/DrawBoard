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
        sizeAux = size,
        sizes = c('size'),
        divCanvas = $('div-canvas'),
        color = "black",
        eraser = $('eraser'),
        blur = 2000000,
        blurAux = blur,
        x,y;

    for (var i = 0; i < colors.length; i++) {
        colors[i].addEventListener('click', colorUpdate, false);
    }

    
    for (var i = 0; i < sizes.length; i++) {
        sizes[i].addEventListener('click', sizeUpdate, false);
    }

    eraser.addEventListener('click',activeEraser,false);

    function activeEraser(e){
        size = e.target.className.split(' ')[2];
        color = e.target.className.split(' ')[1];
        blur = 0;
        socket.emit('change color',color);
    }

    function draw(firstX, firstY, nextX, nextY, color, size) {
        ctx.beginPath();
        ctx.moveTo(firstX, firstY);
        ctx.lineTo(nextX, nextY);
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.stroke();
        ctx.closePath();
        ctx.shadowBlur = blur;
        ctx.shadowColor = color;
        //console.log(nextX+"-"+nextY);
    }

    function sendDrawing(firstX, firstY, nextX, nextY, color, size){
        socket.emit('drawing', {
            x0: firstX/canvas.width,
            y0: firstY/canvas.height,
            x1: nextX/canvas.width,
            y1: nextY/canvas.height,
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
        color = e.target.className.split(' ')[1];
        size = sizeAux;
        blur = blurAux;
        socket.emit('change color',color);
        console.log(color);
    }

    function sizeUpdate(e){
        size = e.target.className.split(' ')[2];
        sizeAux = size;
        console.log(size);
    }

    function Resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function getDrawing(data) {
        var h = canvas.height;
        var w = canvas.width;
        draw(data.x0*w, data.y0*h, data.x1*w, data.y1*h, data.color, data.size);
    }

    function clearCanvas(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }


    canvas.addEventListener('mousedown', isPressed);
    canvas.addEventListener('mouseup', isOut);
    canvas.addEventListener('mouseout', isOut);
    canvas.addEventListener('mousemove', isMoving);
    //window.addEventListener('resize', Resize);
    socket.on('drawing', getDrawing);
    //socket.on('timeClear',clearCanvas);
    Resize();
    console.log(canvas.width+"-"+canvas.height);
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
            username: user
        });
        message.value="";
        chatWindows.scrollTop = chatWindows.scrollHeight;
    }

    function sentTyping(event) {
        socket.emit('chat typing', user);
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
        listUser.innerText = "";
        listUsername.forEach(element => {
            listUser.innerText += "-"+element.username+"- "+element.color+"\n";
        });
    }

    function notName(data){
        user = data;
    }

    btnEnter.addEventListener('click',setUsername,false);
    //btnSend.addEventListener('click', sentMessage, false);
    message.addEventListener('keypress', sentTyping, false);
    socket.on('chat message', getMessage);
    socket.on('chat typing', getTyping);
    socket.on('new user',getListUser);
    socket.on('not name',notName);
}

window.onunload = ()=>{
    if(user!=null)
        socket.emit('disconnected');
}

message();
draw();