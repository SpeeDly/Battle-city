var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');


app.get('/', function (req, res) {
    res.sendFile(__dirname + "/app/index.html");
})

app.use("/static", express.static(__dirname + "/app/static"));

http.listen(3000, function(){
    console.log("The server is working");
});

var blockStates = {
    0: "Free",
    1: "Bricks",
    2: "Water",
    3: "Grass"
}

var Block = function (row, col, state) {
    this.row = row;
    this.col = col;
    this.state = state;
    this.size = 8;
    this.tank_id = -1;
};

Block.prototype.reserveByTank = function(snake_id){
};

Block.prototype.destroyBlock = function() {
};

Block.prototype.generateApple = function() {
    this.state = 2;
};

Block.prototype.removeApple = function() {
    this.state = 0;
};


var Map = function (filename) {
    var file,
        block,
        row = 0,
        col = 0,
        tempArray = [],
        board = [];

    file = fs.readFileSync(path.resolve(__dirname, "./maps", filename), "utf8").split("\n");
    console.log(file);
    var counter = 0;
    file.forEach(function(rows){
        rows = rows.split('');
        rows.forEach(function(el){
            counter++;
            block = new Block(row, col, parseInt(el));
            tempArray.push(block);
            col++;
        })
        board.push(tempArray);
        tempArray = [];
        col = 0;
        row++;
    });
    this.board = board;
    // console.log(this.board);
    // console.log(counter);
};

var Player = function(room_id, name, socket_id){
    this.socket_id = socket_id;
    this.room_id = room_id;
    this.name = name;
    
    this.map;
    this.team = 0;
    this.direction = "top";
    this.left = 0;
    this.top = 0;
}

var Room = function(id, name){
    this.id = id;
    this.name = name;
    this.players = [];
    this.map;
}

Room.prototype.addPlayer = function(player_name, socket_id) {
    var player = new Player(this.id, player_name, socket_id);
    this.players.push(player);
};

Room.prototype.getPlayersNames = function() {
    return this.players.map(function(player){
                var temp = {};
                temp.id = player.id;
                temp.name = player.name;
                return temp;
            })
};

Room.prototype.getPlayerBySocketId = function(socket_id) {
    for (var i = 0; i < this.players.length; i++) {
        if(this.players[i].socket_id == socket_id){
            return this.players[i];
        }
    };
    return false;
};

Room.prototype.removePlayerBySocketId = function(socket_id) {
    for (var i = 0; i < this.players.length; i++) {
        if (this.players[i].socket_id == socket_id) {
            delete this.players[i];
            this.players.splice(i,1);
            break;
        };
    };
};

Room.prototype.deleteAllPlayers = function() {
    for (var i = 0; i < this.players.length; i++) {
        delete this.players[i];
    };
};

Room.prototype.initialPlayer = function(id, team, direction) {
    var player = this.getPlayerBySocketId(id);
    player.team = team;
    player.direction = direction;
};


var rooms = [];

function getRoomByName(name){
    var room = false;
    rooms.forEach(function(r){
        if (name === r.name) {
            room = r;
        }
    });
    return room;
}

function getRoomById(id){
    var room = false;
    rooms.forEach(function(r){
        if (id === r.id) {
            room = r;
        }
    });
    return room;
}

io.on('connection', function (socket) {

    socket.on('getRoomsReq', function () {
        var data = [];
        rooms.forEach(function(room){
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

        room = getRoomById(data.room_id);

        if(!room){
            room = new Room(socket.id, data.room)
            rooms.push(room);
        }

        room.addPlayer(data.name, socket.id);
        names = room.getPlayersNames();
        socket.join(room.name);
        io.to(room.name).emit("joinedPlayer", {"room_id": room.id, "names": names});
    });


    socket.on('startNewGame', function (gameInfo) {
        var room = getRoomById(gameInfo.room_id);
        room.map = new Map(gameInfo.map);

        gameInfo.players.forEach(function(player){
            var direction = player.team === 0 ? "top" : "bottom";
            room.initialPlayer(player.id, player.team, direction);
        });

        io.to(room.name).emit('createdGame', { 
                                                'board': room.map.board,
                                                'room': room
                                              });
    });

    socket.on('newMove', function (data) {
        var room_id = getRoomIDbyName(data.room);
        var room = rooms[room_id];
        var result = room.snakes[data.snake].go(data.command);
        result.changedBlocks.push(room.map.generateApple());
        if(result.gameResult !== -1){
            result.gameResult = room.playerNames[result.gameResult];
        }
        io.to(room.name).emit('nextMove', result);
    });

    socket.on('disconnect', function() {
        var index = -1,
            names = [],
            room = 0;
        rooms.forEach(function(room, i){
            if (room.id === socket.id) {
                index = i;
            };
        });

        if(index === -1){
            rooms.forEach(function(r){
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
            io.to(rooms[index].name).emit("gameEnd", {});
            rooms[index].deleteAllPlayers();
            delete rooms[index];
            rooms.splice(index, 1);
        }
    });
});
