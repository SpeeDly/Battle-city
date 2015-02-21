var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');
var gameFile = require('./battleCity.js');
var Game = gameFile.Game;


app.get('/', function (req, res) {
    res.sendFile(__dirname + "/app/index.html");
})

app.use("/static", express.static(__dirname + "/app/static"));

http.listen(3000, function(){
    console.log("The server is working");
});


io.on('connection', function (socket) {

    socket.on('getRoomsReq', function () {
        var data = [];
        Game.rooms.forEach(function(room){
            var tempData = {}
            tempData.id = room.id;
            tempData.name = room.name;
            data.push(tempData);
        });
        socket.emit("getRoomsResp", {"rooms": data});
    });

    socket.on('joinNewPlayer', function (data) {
        var names = [],
            room;

        room = Game.getRoomById(data.room_id);

        if(!room){
            room = Game.newRoom(socket.id, data.room)
        }

        room.addPlayer(data.name, socket.id);
        names = room.getPlayersNames();
        socket.join(room.name);
        io.to(room.name).emit("joinedPlayer", {"room_id": room.id, "names": names});
    });


    socket.on('startNewGame', function (gameInfo) {
        file = fs.readFileSync(path.resolve(__dirname, "./maps", gameInfo.map), "utf8").split("\n");
        var room = Game.generateMap(gameInfo.room_id, file);

        gameInfo.players.forEach(function(player){
            var direction = player.team === 1 ? "top" : "bottom";
            room.initializePlayer(player.id, player.team, direction);
        });
        room.map.board.forEach(function(rows){
            rows.forEach(function(el){
                if(el.state == 8 || el.state == 9){
                    el.state = 0;
                }
            })
        })
        io.to(room.name).emit('createdGame', {
                                                'room': room,
                                              });
    });

    socket.on('newMove', function (data) {
        // data contain - room, command, player
        var room = Game.getRoomById(data.room),
            player = room.getPlayerBySocketId(data.player),
            move = {},
            update;

        update = room.newMove(player, data.command);
        // move.gameStatus = ;
        move.player = {};
        move.player.id = player.socket_id;
        move.player.topLeft = player.topLeft;
        move.player.direction = player.direction;
        move.player.points = player.points;
        move.update = update;

        io.to(room.name).emit('nextMove', move);
    });

    socket.on('disconnect', function() {
        var index = -1,
            names = [],
            room = 0;
        Game.rooms.forEach(function(room, i){
            if (room.id === socket.id) {
                index = i;
            };
        });

        if(index === -1){
            Game.rooms.forEach(function(r){
                if(r.getPlayerBySocketId(socket.id)){
                    room = r;
                }
            });
            if(room){
                room.removePlayerBySocketId(socket.id);
                names = room.getPlayersNames();
                io.to(room.name).emit("updatePlayers", {"names": names, "room_id": room.id});
            }
        }
        else{
            io.to(Game.rooms[index].name).emit("gameEnd", {});
            Game.rooms[index].deleteAllPlayers();
            delete Game.rooms[index];
            Game.rooms.splice(index, 1);
        }
    });
});
