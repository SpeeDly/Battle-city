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

function closeIndex(){
    $("#index").hide();
    $(document).unbind("keyup");
    $("#menu li.active").unbind("click");
}

function createGame(){
    var data = {};
    $("#create").show();
    $("#create_game").click(function(){
        data.name = $("#id_name").val();
        data.room = $("#id_room").val();
        if(data.name == ""){
            alert("Please enter your name.");
        }
        else if(data.room == ""){
            alert("Please enter the game name.");
        }
        else{
            socket.emit('createGame', data);
        }
    });
}

function joinGame(){
    $("#join").show();
    socket.emit('getRoomsReq');

    socket.on('getRoomsResp', function(data){
        $("#rooms").html("");
        data.rooms.forEach(function(room){
            $("#rooms").append("<div class='room'>" + room + "</div>")
        });
    });
}

indexScreen();

















function promt(){
    $("#start_new_game").click(function(){
        $("#choise").hide();
        $("#create").removeClass("hidden");
    });

    $("#find_created_game").click(function(){
        $("#choise").hide();
        $("#find").removeClass("hidden");
    });

    $("label i").click(function(){
        socket.emit('getRoomsReq');
    })



    $("#rooms").on("click", ".room", function(){
        $(".room").removeClass("active");
        $(this).addClass("active");
    });

    $("#find #new_game2").click(function(){
        var room = $(".room.active");
        if(room.length !== 0){
            socket.emit('joinNewPlayer', {"name": $("#id_name2").val(), "room": room.text()});
            $("#room_name").val(room.text());
            $("#find").hide();
            $("#wait").removeClass("hidden");
            $("#id_realname").val($("#id_name2").val());
        }
        else{
            alert("Please select a room.");
        }
    });

    var initialData = {};
    $("#create #new_game").click(function(){
        initialData.cols = $("#id_cols").val();
        initialData.rows = $("#id_rows").val();
        initialData.size = $("#id_blocks").val();
        initialData.name = $("#id_name").val();
        initialData.room = $("#id_room").val();

        socket.emit('joinNewPlayer', {"name": initialData.name, "room": initialData.room});
        $("#id_realname").val($("#id_name").val());
        
        $("#room_name").val(initialData.room);
        
        $("#create").hide();
        $("#wait").removeClass("hidden");
        $("#start_real_game").removeClass("hidden");
    });

    $("#wait #start_real_game").click(function(){
        socket.emit('newGame', initialData);
    });
}

promt();

socket.on('generateMap', function (data) {
    $("#wait").hide();
    init(data.board);
});

socket.on('joinedPlayer', function (data) {
    var $container = $("#connected_players"),
        $score = $("#snake .score");

    $container.html("");
    $score.html("");

    data.names.forEach(function(name, i){
        $container.append("<div class=" + name + " data-snake=" + i + ">" + name + "</div>");
        $score.append("<li class=player_" + i +">" + name + ": <span></span></li>")
    })
});

window.onbeforeunload = function() {
    var end = {};
    end.room = $("#room_name").val();
    socket.emit('endGame', end);
    return null;
}