$(document).ready(function(){

// CONSTANTS
var LEFT = 37
      RIGHT = 39
      TOP = 38
      DOWN = 40
      BLOCK_SIZE = 32
      COLS = 32
      ROWS = 16;

var interval;

var Block = function (row, col, state) {
    this.row = row;
    this.col = col;
    this.state = state;
    this.width = BLOCK_SIZE;
    this.height = BLOCK_SIZE;
};

Block.prototype.draw = function() {
    $("#game").append('<div class="block" style="width:' + this.width + 'px; height:' + this.height + 'px;" data-row="' + this.row + '" data-col="' + this.col + '" data-state="' + this.state + '"></div>');
};

Block.prototype.getElement = function() {
    return $("div.block[data-row='" + this.row + "']").filter("[data-col='" + this.col + "']");
};

Block.prototype.getTopBlock = function() {
    var row = this.row === 0 ? ROWS-1 : (this.row-1);
    return board[row][this.col];
};

Block.prototype.getBottomBlock = function() {
    var row = this.row ===  ROWS-1 ? 0 : (this.row+1);
    return board[row][this.col];
};

Block.prototype.getLeftBlock = function() {
    var col = this.col === 0 ? COLS-1 : (this.col-1);
    return board[this.row][col];
};

Block.prototype.getRightBlock = function() {
    var col = this.col === COLS-1 ? 0 : (this.col+1);
    return board[this.row][col];
};

Block.prototype.getCoords = function() {
    return [this.row, this.col];
};

Block.prototype.setCoords = function(coords) {
    this.row = coords[0];
    this.col = coords[1];
};

Block.prototype.makeSnake = function(player) {
    this.getElement().addClass("snake player1");
    this.state = 1;
};

Block.prototype.removeSnake = function(player) {
    this.getElement().removeClass("snake player1");
    this.state = 0;
};

Block.prototype.makeApple = function() {
    this.getElement().addClass("apple");
    this.state = 2;
};

Block.prototype.removeApple = function() {
    this.getElement().removeClass("apple");
    this.state = 0;
};

var Map = function (blockSize, rows, cols) {
    var block
          row = 0
          col = 0
          tempArray = []
          board = [];

    $("#game").css({
        "width": blockSize*cols,
        "height": blockSize*rows,
    });

    for (var i = 1; i <= (rows*cols); i++) {
        block = new Block(row, col, 0);
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
    this.board.forEach(function(blocks){
        blocks.forEach(function(block){
            block.draw();
        })
    })
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

    if (checkForApple.length > 0) { console.log(checkForApple.length); return false;}; 

    possibleBlocks = possibleBlocks.filter(function(e){
        if (e.state == 0) {
            return true;
        }
        else{
            return false;
        }
    });
    possibleBlocks[Math.floor(Math.random()*possibleBlocks.length)].makeApple();
};

var Snake = function (player, elements, headPosition) {
    this.player = "player";
    this.elements = elements;
    this.snakeBlocks = [];
    this.direction = "top";
    this.points = 0;
    var currentNode = headPosition
    for (var i = 0; i < this.elements; i++) {
        this.snakeBlocks.push(currentNode);
        currentNode = currentNode.getBottomBlock();
    };
};

Snake.prototype.render = function() {
    this.snakeBlocks.forEach(function(block){
        block.makeSnake(this.player);
    });
};

Snake.prototype.go = function(direction) {
    // define required arguments
    var lastBlock = this.snakeBlocks[this.snakeBlocks.length-1],
          copySnake = this.snakeBlocks.slice(0),
          nextBlock;

    if(
        (this.direction === TOP && direction === DOWN) ||
        (this.direction === DOWN && direction === TOP) ||
        (this.direction === LEFT && direction === RIGHT) ||
        (this.direction === RIGHT && direction === LEFT))
    {
    }
    else{
        this.direction = direction;
    }

    switch(this.direction){
        case TOP:
            nextBlock = this.snakeBlocks[0].getTopBlock();
            break;
        case DOWN:
            nextBlock = this.snakeBlocks[0].getBottomBlock();
            break;
        case LEFT:
            nextBlock = this.snakeBlocks[0].getLeftBlock();
            break;
        case RIGHT:
            nextBlock = this.snakeBlocks[0].getRightBlock();
            break;
    }

    if(nextBlock.state === 0 ){
        lastBlock.removeSnake(this.player);
        this.snakeBlocks[0] = nextBlock;
        for (var i = 1; i < this.snakeBlocks.length; i++) {
            this.snakeBlocks[i] = copySnake[i-1];
        }
        this.render();
    }
    else if(nextBlock.state === 1 ){
        alert("points:", this.points);
        clearInterval(interval);
    }
    else if(nextBlock.state === 2 ){
        this.points++;
        this.elements++;
        this.snakeBlocks.unshift(nextBlock);
        nextBlock.removeApple();
        nextBlock.makeSnake();
    }

};


function init(){
    var map = new Map(BLOCK_SIZE, ROWS, COLS);
    map.generate();

    function connectPlayer(){
        var snake = new Snake("snake1", 5, board[5][5]);
        snake.render();
        return snake;
    }
    var top = TOP
          left = LEFT
          right = RIGHT
          down = DOWN;

    var snake = connectPlayer();
    var command = top;
    $(document).keyup(function(event){
        if (event.which === top || event.which === left || event.which === right || event.which === down) {
            command = event.which;        
        };
    })

    interval = setInterval(function(){
        snake.go(command);
        map.generateApple();
    }, 150);
}

init();



});