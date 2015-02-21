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
            this.block2 = board[row+1][col-1];
            break;
        case "top":
            this.block1 = board[row-1][col];
            this.block2 = board[row-1][col+1];
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


var Player = function(room_id, name, socket_id){
    this.socket_id = socket_id;
    this.room_id = room_id;
    this.name = name;

    this.team = 0;
    this.direction;
    this.topLeft = undefined;
    this.bullet = undefined;
    this.points = 0;
}

Player.prototype.shot = function(){
    try{
        this.bullet = new Bullet(this);        
    }
    catch(err){
        console.log(err);
    }
}

Player.prototype.moveBullet = function(){
    var changed_blocks = [];

    if(this.bullet != undefined){
        try{
            this.bullet.next();
            if (this.bullet.block1.state == 1 || this.bullet.block2.state == 1) {
                if(this.bullet.block1.state == 1) this.bullet.block1.state = 0;
                if(this.bullet.block2.state == 1) this.bullet.block2.state = 0;

                changed_blocks = changed_blocks.concat([this.bullet.block1, this.bullet.block2]);
                this.bullet = undefined;
            }

            if (this.bullet.block1.state == 1 || this.bullet.block2.state == 1) {
                if(this.bullet.block1.state == 1) this.bullet.block1.state = 0;
                if(this.bullet.block2.state == 1) this.bullet.block2.state = 0;

                changed_blocks = changed_blocks.concat([this.bullet.block1, this.bullet.block2]);
                this.bullet = undefined;
            }
        }
        catch(err){
            this.bullet = undefined;
        }
    }
    return changed_blocks;
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

Room.prototype.initializePlayer = function(id, team, direction) {
    var player = this.getPlayerBySocketId(id);
    var positions = [],
        temp = [];
    player.team = team;
    player.direction = direction;

    for (var i = 0; i < this.map.board.length; i++) {
        temp = [];
        temp = this.map.board[i].filter(function(el){
            if ((team == 1 && el.state == 8) ||
                (team == 2 && el.state == 9))
            {
                return true;
            };
        })
        positions = positions.concat(temp);
    }
    player.topLeft = positions[Math.floor(Math.random()*positions.length)];
    player.topLeft.state = 0;
};

Room.prototype.newMove = function(player, command){
    var row = player.topLeft.row,
        col = player.topLeft.col,
        board = this.map.board,
        update;

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
            if (row != 20 &&
                (board[row+2][col].state == 0 || board[row+2][col].state == 3) && 
                (board[row+2][col+1].state == 0 || board[row+2][col+1].state == 3)
               ) 
            {
                player.topLeft = board[row+1][col];
                player.direction = "bottom";
            };
            break;
    }

    update = this.updateAllBullets();
    return update;
}

Room.prototype.updateAllBullets = function(){
    var update = {};
    update.bullets = [];
    update.changed_blocks = [];
    
    this.players.forEach(function(player){
        if (player.bullet != undefined) {
            var changed_blocks = player.moveBullet();
            update.changed_blocks = update.changed_blocks.concat(changed_blocks);
            if (player.bullet != undefined){
                update.bullets.push(player.bullet);
            }
        }
    })
    return update;
}