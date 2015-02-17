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
};

var Map = function (filename) {
    var file,
        block,
        row = 0,
        col = 0,
        tempArray = [],
        board = [];

    file = fs.readFileSync(path.resolve(__dirname, "./maps", filename), "utf8").split("\n");
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
};

var Bullet = function(player){
    this.room_id = player.room_id;
    this.direction = player.direction;
    this.block1;
    this.block2;

    var room = getRoomById(player.room_id);
    var row = player.topLeft.row,
        col = player.topLeft.col,
        board = room.map.board;

    switch(player.direction){
        case "left":
            this.block1 = player.topLeft;
            this.block2 = board[row-1][col];
            break;
        case "top":
            this.block1 = player.topLeft;
            this.block2 = board[row][col+1];
            break;
        case "right":
            this.block1 = board[row][col+1];
            this.block2 = board[row+1][col+1];
            break;
        case "bottom":
            this.block1 = board[row+1][col];
            this.block2 = board[row+1][col+1];
            break;
    }
}

Bullet.prototype.next = function(){
    var room = getRoomById(this.room_id);
    var row = this.block1.row,
        col = this.block1.col,
        board = room.map.board;

    switch(this.direction){
        case "left":
            this.block1 = board[row][col-1];
            this.block2 = board[row-1][col-1];
            break;
        case "top":
            this.block1 = board[row-1][col];
            this.block2 = board[row-1][col+1];
            break;
        case "right":
            this.block1 = board[row][col+1];
            this.block2 = board[row][col+1];
            break;
        case "bottom":
            this.block1 = board[row+1][col];
            this.block2 = board[row+1][col+1];
            break;
    }
}


var Player = function(room_id, name, socket_id){
    this.socket_id = socket_id;
    this.room_id = room_id;
    this.name = name;

    this.team = 0;
    this.direction;
    this.topLeft = undefined;
    this.bullet = undefined;
}

Player.prototype.shot = function(){
    this.bullet = new Bullet(this);
}

Player.prototype.moveBullet = function(){
    try{
        this.bullet.next();
    }
    catch(err){
        this.bullet = undefined;
    }
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
                temp.id = player.socket_id;
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
            this.players.splicet(i,1);
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
    this.map.board.forEach(function(rows){
        rows.forEach(function(el){
            if (team == 1 && el.state == 8 ||
                team == 2 && el.state == 9)
            {
                el.state = 0;
                player.topLeft = el;
            };
        });
    });
};

Room.prototype.newMove = function(player, command){
    var row = player.topLeft.row,
        col = player.topLeft.col,
        board = this.map.board,
        bullets;

    switch(command){
        case 32:   //SPACE
            if (player.bullet == undefined){
                player.shot();
            }
            break;
        case 37:   //LEFT
            if (col != 0 &&
                (board[row][col-1].state == 0 || board[row][col-1].state == 3) &&
                (board[row+1][col-1].state == 0 || board[row+1][col-1].state == 3)
               ) 
            {
                player.topLeft = board[row][col-1];
                player.direction = "left";
            }
            break;
        case 38:   //TOP
            if (row != 0 &&
                (board[row-1][col].state == 0 || board[row-1][col].state == 3) &&
                (board[row-1][col+1].state == 0 || board[row-1][col+1].state == 3)
               ) 
            {
                player.topLeft = board[row-1][col];
                player.direction = "top";
            };
            break;
        case 39:   //RIGHT
            if (col != 47 &&
                (board[row][col+2].state == 0 || board[row][col+2].state == 3) &&
                (board[row+1][col+2].state == 0 || board[row+1][col+2].state == 3)
               ) 
            {
                player.topLeft = board[row][col+1];
                player.direction = "right";
            };
            break;
        case 40:   //BOTTOM
            if (row != 21 &&
                (board[row+2][col].state == 0 || board[row+2][col].state == 3) && 
                (board[row+2][col+1].state == 0 || board[row+2][col+1].state == 3)
               ) 
            {
                player.topLeft = board[row+1][col];
                player.direction = "bottom";
            };
            break;
    }

    bullets = this.updateAllBullets();
    return bullets;
}

Room.prototype.updateAllBullets = function(){
    var bullets = [];
    this.players.forEach(function(player){
        if (player.bullet != undefined) {
            player.moveBullet();
            if (player.bullet != undefined){
                bullets.push(player.bullet);
            }
        }
    })
    return bullets;
}

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
            var direction = player.team === 1 ? "top" : "bottom";
            room.initialPlayer(player.id, player.team, direction);
        });
        io.to(room.name).emit('createdGame', {
                                                'room': room,
                                              });
    });

    socket.on('newMove', function (data) {
        // data contain - room, command, player
        var room = getRoomById(data.room),
            player = room.getPlayerBySocketId(data.player),
            move = {};

        bullets = room.newMove(player, data.command);

        // move.gameStatus = ;
        move.player = {};
        move.player.id = player.socket_id;
        move.player.topLeft = player.topLeft;
        move.player.direction = player.direction;
        move.bullets = bullets;

        io.to(room.name).emit('nextMove', move);
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
