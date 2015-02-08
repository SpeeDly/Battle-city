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
