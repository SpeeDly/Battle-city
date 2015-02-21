var gameInfo = {};

function indexScreen(){
    $(document).keyup(function(e){
        if(e.which === 38 || e.which === 40){
            var $temp = $("#menu li.active");
            $("#menu li").addClass("active");
            $temp.removeClass("active");
        }
        else if(e.which === 13){
            $("#menu li.active").click();
        }
    });
    $("#menu li").click(function(){
        closeIndex();
        console.log($(this).data("choice"));
        if($(this).data("choice") == "1")
        {
            createGame();
        }
        else
        {
            joinGame();
        }
    });
}

function createGame(){
    var data = {};
    $("#create").show();
    $("#create_game").click(function(){
        data.room_id = -1;
        data.room = $("#id_room").val();
        data.name = $("#id_name").val();
        if(data.name == ""){
            alert("Please enter your name.");
        }
        else if(data.room == ""){
            alert("Please enter the game name.");
        }
        else{
            socket.emit('joinNewPlayer', data);
            closeCreateGame();

            gameInfo.name = data.room;
            gameInfo.my_name = data.name;
            gameInfo.isHost = true;
            gameInfo.map = $("#map_name option:selected").text();
        }
    });
}

function joinGame(){
    $("#join").show();
    var joinRoom = {};

    socket.emit('getRoomsReq');

    $("#rooms").on("click", ".room", function(){
        $(".room").removeClass("active");
        $(this).addClass("active");
    });

    $("#join_game").click(function(){
        joinRoom.room_id = $(".room.active").data("socketid");
        joinRoom.room = $(".room.active").text();
        joinRoom.name = $("#join #id_name2").val();
        socket.emit('joinNewPlayer', joinRoom);

        gameInfo.room_id = joinRoom.room_id;
        gameInfo.name = joinRoom.room;
        gameInfo.my_name = joinRoom.name;
        gameInfo.socket_id = socket.id;
        closeJoinGame();
        gameInfo.isHost = false;
    });
}

indexScreen();

$("#join label i").click(function(){
    socket.emit('getRoomsReq');
})

socket.on('joinedPlayer', function(data){
    $("#wait").show();
    gameInfo.room_id = data.room_id;
    handleJoinedPlayer(data.names);
});

socket.on('getRoomsResp', function(data){
    $("#rooms").html("");
    data.rooms.forEach(function(room){
        $("#rooms").append("<div class='room' data-socketid=" + room.id + ">" + room.name + "</div>")
    });
    $("#rooms").children().eq(0).addClass("active");
});

socket.on('gameEnd', function(){
    location.reload(true);
});

socket.on('updatePlayers', function(data){
    gameInfo.room_id = data.room_id;
    handleJoinedPlayer(data.names);
});

function handleJoinedPlayer(names){
    gameInfo.players = [];
    $(".teaming").html("");
    names.forEach(function(data, i){
        if (i%2) {
            $("#bad").append("<li data-team='1' data-playerid=" + data.id + ">" + data.name + "</li>");
            gameInfo.players.push({"id": data.id, "team": 2 });
        }
        else{
            $("#good").append("<li data-team='0' data-playerid=" + data.id + ">" + data.name + "</li>");
            gameInfo.players.push({"id": data.id, "team": 1 });
        }
    });

    if(names.length > 1 && gameInfo.isHost){
        $("#start_real_game").show();
    }
}

$("#start_real_game").click(function(){
    socket.emit('startNewGame', gameInfo);
})

socket.on('createdGame', function(data){
    closeWaitingGame();
    init(data);
});

// clean methods
function closeIndex(){
    $("#index").hide();
    $(document).off("keyup");
    $("#menu li").off("click");
}

function closeCreateGame(){
    $("#create").hide();
    $("#create_game").off("click");
}

function closeJoinGame(){
    $("#join").hide();
    $("#create_game").off("click");
    $("#join_game").off("click");
}

function closeWaitingGame(){
    $("#wait").hide();
}
