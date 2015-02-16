function init(data){
    var interval, command, name, room;

    game = new Game(data.room);
    game.generate();

    socket.on('nextMove', function(data){
        var player_id = data.player.id;
        var player = game.getPlayerById(player_id);
        player.direction = data.player.direction;
        player.topLeft = game.board[data.player.topLeft.row][data.player.topLeft.col];
        player.regenerate();
    });

    $(document).keyup(function(event){
        if (event.which === 38 || event.which === 37 || event.which === 39 || event.which === 40) {
            game.newMove(event.which);
        };
    })


    // command = 38;

    
    // interval = setInterval(function(){
    //     socket.emit('newMove', {room: room, command: command, snake: snake });
    // }, 200);



    // socket.on('nextMove', function (data) {
    //     game.render(data.changedBlocks);
    //     $(".score .player_" + data.snake_id + " span").text(data.points);

    //     if(data.gameResult !== -1){
    //         clearInterval(interval);
    //         alert(data.gameResult + " lost the game!");
    //         window.location.reload(true);
    //     }
    // });
    // socket.on('render', function (data) {
    //     e.render(data.board);
    // });
}
