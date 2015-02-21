function init(data){
    var interval, command, name, room;

    game = new Game(data.room);
    game.generate();

    socket.on('nextMove', function(data){
        var player_id = data.player.id,
            player = game.getPlayerById(player_id),
            bullets = data.update.bullets,
            changed_blocks = data.update.changed_blocks;

        player.direction = data.player.direction;
        player.topLeft = game.board[data.player.topLeft.row][data.player.topLeft.col];
        player.points = data.player.points;
        player.regenerate();

        $(".bullet").remove();

        bullets.forEach(function(bullet){
            game.drawBullet(bullet);
        })

        game.updateBoard(changed_blocks);
        game.refreshScore();
    });

    $(document).keyup(function(event){
        if (event.which === 38 || event.which === 37 || event.which === 39 || event.which === 40 || event.which === 32) {
            command = event.which;
        };
    })

    setInterval(function(){
        game.newMove(command);
        command = undefined;
    }, 100);
}
