var Game = function(room, board){
    this.room_id = room.id;
    this.game_name = room.name;
    this.players = room.players;
    room.players.forEach(function(player){
        if(player.socket_id === socket.id){
            this.player_name = player.name;
        }
    });

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            board[i][j] = castToBlock(board[i][j]);
        };
    };

    this.board = board;
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
}

var Block = function (row, col, state, size, tank_id) {
    this.row = row;
    this.col = col;
    this.state = state;
    this.size = 24;
    this.tank_id = tank_id;
};

Block.prototype.draw = function() {
    var pixel = '<div class="block ';
    if (this.state === 0) {
        pixel += '';
    }
    else if(this.state === 1){
        pixel += 'wall';
    }
    else if(this.state === 2){
        pixel += 'water';
    }
    else if(this.state === 3){
        pixel += 'grass';
    }
    else{
        pixel += 'tank_' + this.tank_id;
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

Block.prototype.render = function() {
    var $block = this.getElement();
    if (this.state === 0) {
        $block.removeClass();
        $block.addClass("block");
    }
    else if(this.snake_id === 0 && this.state === 1){
        $block.removeClass();
        $block.addClass("block wall");
    }
    else if(this.state === 2){
        $block.removeClass();
        $block.addClass("block apple");
    }
    else{
        $block.removeClass();
        $block.addClass("block snake_" + this.snake_id);
    }
};


Game.prototype.render = function(blocks) {
    var allBlocks = this.board.reduce(function(a, b) {
        return a.concat(b);
    });
    var changedBlocks = [];
    blocks.forEach(function(block){
        var temp = allBlocks.filter(function(e){
            if(block.row === e.row && block.col == e.col){
                e.state = block.state;
                e.snake_id = block.snake_id;
                return true
            }
        });
        if(temp[0] !== undefined){
            changedBlocks.push(temp[0]);
        }
    });

    changedBlocks.forEach(function(block){
            block.render();
    })
};

function castToBlock(el) {
    return new Block(el.row, el.col, el.state, el.size, el.tank_id);
};
