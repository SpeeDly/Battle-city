function init(data){
    var interval, command, name, room;

    game = new Game(data.room, data.board);
    game.generate();

    // command = 38;
    // $(document).keyup(function(event){
    //     if (event.which === 38 || event.which === 37 || event.which === 39 || event.which === 40) {
    //         command = event.which;
    //     };
    // })
    
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
