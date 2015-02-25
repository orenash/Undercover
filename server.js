var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var Settings = require("./settings.js");
var Game = require('./game.js');

app.use('/', express.static(__dirname + '/public'));

app.get('/utils.js', function(req, res) {
    res.sendFile(__dirname + '/utils.js');
});

http.listen(Settings.PORT, function(){
    console.log('listening on *:' + Settings.PORT);
});

function userConnected(socket) {
    socket.on("joinGame", function(name){
        socket.userName = name;
        addUserToWaitingList(socket)
    });
}

var waitingUsers = [];
function addUserToWaitingList(user) {
    console.log("Player \""+user.userName+"\" connected from "+user.conn.remoteAddress
        + ", added to waiting list");
    waitingUsers.push(user);

    if (waitingUsers.length==Settings.NUM_PLAYERS) {
        for (var u in waitingUsers) {
            waitingUsers[u].removeAllListeners("disconnect");
        }
        var game = new Game(io, waitingUsers);
        waitingUsers = [];
    } else {
        for (var u in waitingUsers) {
            waitingUsers[u].emit("waiting", waitingUsers.length);
        }
        user.on("disconnect", function() {
            // Remove from waiting list
            console.log("Player \""+user.userName+"\" disconnected, removed from waiting list");
            waitingUsers = waitingUsers.filter(function(u){return u.id!=user.id});
            for (var u in waitingUsers) {
                waitingUsers[u].emit("waiting", waitingUsers.length);
            }
        });
    }
}


io.on('connection', userConnected);

