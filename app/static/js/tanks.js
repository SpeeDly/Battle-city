var Player = function(id, game, name, team, topLeft, direction){
    this.id = id;
    this.game = game;
    this.name = name;
    this.team = team;
    this.topLeft = topLeft;
    this.isShooted = false;
    this.direction = direction;
}

Player.prototype.generate = function(){
    var pos = this.topLeft.getElement().position();
    $("#game").append("<img src='/static/img/tank" + this.team + ".png' alt='tank' class='tank team_" + this.team + "' id='" + this.id + "'/>");
    $("#" + this.id).css({
                    "top": pos.top,
                    "left": pos.left
                    });
    this.turn();
}

Player.prototype.regenerate = function(){
    var pos = this.topLeft.getElement().position();
    $("#" + this.id).css({
                    "top": pos.top,
                    "left": pos.left
                    });
    this.turn();
}

Player.prototype.turn = function(){
    var degrees = 0;
    switch(this.direction){
        case "top":
            degrees = 90;
            break;
        case "right":
            degrees = 180;
            break;
        case "bottom":
            degrees = 270;
            break;
    }

    $("#" + this.id).css({'-webkit-transform' : 'rotate('+ degrees +'deg)',
             '-moz-transform' : 'rotate('+ degrees +'deg)',
             '-ms-transform' : 'rotate('+ degrees +'deg)',
             'transform' : 'rotate('+ degrees +'deg)'});
}


var Game = function(room){
    this.room_id = room.id;
    this.game_name = room.name;
    this.players;
    this.player;
    this.board;

    var board = room.map.board;
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            board[i][j] = castToBlock(board[i][j]);
        };
    };
    this.board = board;
    var players = [];
    var temp_player;

    var this_this = this;

    room.players.forEach(function(player){
        var topLeft = board[player.topLeft.row][player.topLeft.col];
        var newPlayer = new Player(player.socket_id, this_this, player.name, player.team, topLeft, player.direction);
        players.push(newPlayer);
        if(player.name == gameInfo.my_name){
            temp_player = newPlayer;
        }
    });
    this.player = temp_player;
    this.players = players
}

Game.prototype.generate = function() {
    $("#battleTanks").show();
    $("#game").css({
        "width": this.board[0][0].size*this.board[0].length,
        "height": this.board[0][0].size*this.board.length,
    });

    this.board.forEach(function(blocks){
        blocks.forEach(function(block){
            block.draw();
        })
    })

    this.generatePlayers();
}

Game.prototype.generatePlayers = function() {
    this.players.forEach(function(player){
        player.generate();
    })
}

Game.prototype.getPlayerById = function(id) {
    for (var i = 0; i < this.players.length; i++) {
        if(this.players[i].id == id){
            return this.players[i];
        }
    };
    return false;
};

Game.prototype.newMove = function(command){
    socket.emit('newMove', {"room": this.room_id, "command": command, "player": this.player.id });
}

Game.prototype.drawBullet = function(bullet){
    var id = makeid();
    $("#game").append("<img src='/static/img/bullet.png' id='" + id + "' class='bullet'/>");
    var pos = this.board[bullet.block1.row][bullet.block1.col].getElement().position();

    $("#" + id).css({
                    "top": pos.top,
                    "left": pos.left
                    });

    switch(bullet.direction){
        case "top":
            degrees = 90;
            break;
        case "right":
            degrees = 180;
            break;
        case "bottom":
            degrees = 270;
            break;
    }

    $("#" + id).css({'-webkit-transform' : 'rotate('+ degrees +'deg)',
             '-moz-transform' : 'rotate('+ degrees +'deg)',
             '-ms-transform' : 'rotate('+ degrees +'deg)',
             'transform' : 'rotate('+ degrees +'deg)'});
    
}


var Block = function (row, col, state, size) {
    this.row = row;
    this.col = col;
    this.state = state;
    this.size = 24;
};

Block.prototype.draw = function() {
    var pixel = '<div class="block ';

    if(this.state === 1){
        pixel += 'wall';
    }
    else if(this.state === 2){
        pixel += 'water';
    }
    else if(this.state === 3){
        pixel += 'grass';
    }
    else{
        pixel += '';
    }
    pixel += '" style="width:';
    pixel += this.size;
    pixel += 'px; height:';
    pixel += this.size;
    pixel += 'px;" data-row="';
    pixel += this.row;
    pixel += '" data-col="';
    pixel += this.col;
    pixel += '" data-state="';
    pixel += this.state;
    pixel += '"></div>';
    $("#game").append(pixel);
};

Block.prototype.getElement = function() {
    return $("div.block[data-row='" + this.row + "']").filter("[data-col='" + this.col + "']");
};

function castToBlock(el) {
    return new Block(el.row, el.col, el.state, el.size);
};

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}