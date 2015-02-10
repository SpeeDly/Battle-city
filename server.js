var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/app/index.html");
})

app.use("/static", express.static(__dirname + "/app/static"));

http.listen(3000, function(){
    console.log("The server is working");
});

var Block = function (row, col, state, blockSize) {
    this.row = row;
    this.col = col;
    this.state = state;
    this.size = blockSize;
    this.snake_id = 0;
};

Block.prototype.makeSnake = function(snake_id) {
    // moje bi tuka e proverkata !!!
    this.snake_id = snake_id;
    this.state = 1;
};

Block.prototype.removeSnake = function() {
    // moje bi tuka e proverkata !!!
    this.snake_id = 0;
    this.state = 0;
};

Block.prototype.generateApple = function() {
    this.state = 2;
};

Block.prototype.removeApple = function() {
    this.state = 0;
};


var Map = function (rows, cols, size) {
    var block
        row = 0
        col = 0
        tempArray = []
        board = [];

    for (var i = 1; i <= (rows*cols); i++) {
        block = new Block(row, col, 0, size);
        tempArray.push(block);

        if (i%cols === 0 || i === (rows*cols)) {
            col = 0;
            row++;
            board.push(tempArray);
            tempArray = [];
        }
        else{
            col++;
        }
    };
    this.board = board;
};

Map.prototype.generate = function() {
    return this.board
};

Map.prototype.generateApple = function() {
    var possibleBlocks = this.board.reduce(function(a, b) {
        return a.concat(b);
    });

    var checkForApple = possibleBlocks.filter(function(e){
        if (e.state == 2) {
            return true;
        }
        else{
            return false;
        }
    });

    if (checkForApple.length > 0) return false;

    possibleBlocks = possibleBlocks.filter(function(e){
        if (e.state == 0) {
            return true;
        }
        else{
            return false;
        }
    });

    var changedBlock = possibleBlocks[Math.floor(Math.random()*possibleBlocks.length)];
    changedBlock.generateApple();
    return changedBlock;
};


var Snake = function (snakeNumber, map, headPosition) {
    this.snake_id = snakeNumber;
    this.snakeBlocks = [];
    this.direction;
    this.points = 0;
    this.map = map;
    var currentNode = headPosition
    for (var i = 0; i < 5; i++) {
        this.snakeBlocks.push(currentNode);
        var row = currentNode.row === map.board.length-1 ? 0 : (currentNode.row+1);
        currentNode = map.board[row][currentNode.col];
    };
};

Snake.prototype.generate = function() {
    var snakeNumber = this.snake_id;
    this.snakeBlocks.forEach(function(block){
        block.makeSnake(snakeNumber);
    });
};

Snake.prototype.go = function(direction) {
    // define required arguments
    var lastBlock = this.snakeBlocks[this.snakeBlocks.length-1],
          copySnake = this.snakeBlocks.slice(0),
          nextBlock;
    var result = {
        "changedBlocks": [],
        "gameResult": -1,
        "points": this.points,
        "snake_id": this.snake_id,
    }

    if(
        (this.direction === 38 && direction === 40) ||
        (this.direction === 40 && direction === 38) ||
        (this.direction === 37 && direction === 39) ||
        (this.direction === 39 && direction === 37))
    {
    }
    else{
        this.direction = direction;
    }

    var block = this.snakeBlocks[0],
        board = this.map.board,
        ROWS = board.length,
        COLS = board[0].length,
        row, col;
    switch(this.direction){
        case 38:
            row = block.row === 0 ? ROWS-1 : (block.row-1);
            nextBlock = board[row][block.col];
            break;
        case 40:
            row = block.row === ROWS-1 ? 0 : (block.row+1);
            nextBlock = board[row][block.col];
            break;
        case 37:
            col = block.col === 0 ? COLS-1 : (block.col-1);
            nextBlock = board[block.row][col];
            break;
        case 39:
            col = block.col === COLS-1 ? 0 : (block.col+1);
            nextBlock = board[block.row][col];
            break;
    }

    if(nextBlock.state === 0 ){
        lastBlock.removeSnake();
        nextBlock.makeSnake(this.snake_id);
        result.changedBlocks.push(lastBlock);
        result.changedBlocks.push(nextBlock);
        this.snakeBlocks[0] = nextBlock;

        for (var i = 1; i < this.snakeBlocks.length; i++) {
            this.snakeBlocks[i] = copySnake[i-1];
            result.changedBlocks.push(this.snakeBlocks[i]);
        }
    }
    else if(nextBlock.state === 1 ){
        result.gameResult = this.snake_id;
    }
    else if(nextBlock.state === 2 ){
        this.points++;
        result.points = this.points;
        this.snakeBlocks.unshift(nextBlock);
        result.changedBlocks.push(nextBlock);
        nextBlock.removeApple();
        nextBlock.makeSnake(this.snake_id);
    }
    return result;
};

var Player = function(room_id, name, socket_id, team){
    this.room_id = room_id;
    this.name = name;
    this.socket_id = socket_id;
    this.team = 0;
}

var Room = function(id, name){
    this.id = id;
    this.name = name;
    this.players = [];
}

Room.prototype.addPlayer = function(player_name, socket_id) {
    var player = new Player(this.id, player_name, socket_id);
    this.players.push(player);
};

Room.prototype.getPlayersNames = function() {
    return this.players.map(function(player){
                return player.name;
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
        console.log("room.id", room.id);
        console.log("data", data.room_id);
        if(!room){
            room = new Room(socket.id, data.room)
            rooms.push(room);
        }

        room.addPlayer(data.name, socket.id);
        names = room.getPlayersNames();
        socket.join(room.name);
        io.to(room.name).emit("joinedPlayer", {"names": names});
    });


    socket.on('createGame', function (data) {
        var room = rooms[getRoomIDbyName(data.room)];
        room.map = new Map(data.rows, data.cols, data.size);
        room.board = room.map.generate();
        room.snakes = [];

        room.playerNames.forEach(function(e, i){
            var snake = new Snake((i+1), room.map, room.board[5][(3+(i*3))]);
            room.snakes.push(snake);
        });

        room.snakes.forEach(function(snake){
            snake.generate();
        });
        io.to(room.name).emit('generateMap', { board: board });
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
                console.log("yesbe");
                room.removePlayerBySocketId(socket.id);
                names = room.getPlayersNames();
                io.to(room.name).emit("updatePlayers", {"names": names});
            }
        }
        else{
            // if the leaved player is host, delete the room
            io.to(rooms[index].name).emit("gameEnd", {});
            rooms[index].deleteAllPlayers();
            delete rooms[index];
            rooms.splice(index, 1);
        }
    });
});
