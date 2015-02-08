function init(board){
    var interval, command, snake, name, room;
    name = $("#id_realname").val();
    snake = $("#connected_players ." + name).data("snake");
    room = $("#room_name").val();

    $(".start_game").addClass("hidden");
    $("#snake").removeClass("hidden");

    game = new Game(board);
    game.generate();

    command = 38;
    $(document).keyup(function(event){
        if (event.which === 38 || event.which === 37 || event.which === 39 || event.which === 40) {
            command = event.which;
        };
    })
    
    interval = setInterval(function(){
        socket.emit('newMove', {room: room, command: command, snake: snake });
    }, 200);



    socket.on('nextMove', function (data) {
        game.render(data.changedBlocks);
        $(".score .player_" + data.snake_id + " span").text(data.points);

        if(data.gameResult !== -1){
            clearInterval(interval);
            alert(data.gameResult + " lost the game!");
            window.location.reload(true);
        }
    });
    // socket.on('render', function (data) {
    //     e.render(data.board);
    // });
}
