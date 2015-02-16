var Tank = function(socket_id, name, team, topLeft){
    this.socket_id = socket_id;
    this.name = name;
    this.team = team;
    this.topLeft = topLeft;
    this.isShooted = false;
    this.head = "left";
}

Tank.prototype.generate = function(){
    var pos = this.topLeft.position();
    $("#game").append("<img src='/static/img/tank1.png' alt='tank' id='tank_1'/>");
    $("#tank_1").css({
                    "top": pos.top,
                    "left": pos.left
                    });
}

Tank.prototype.regenerate = function(){
    var pos = this.topLeft.position();
    $("#tank_1").css({
                    "top": pos.top,
                    "left": pos.left
                    });
    // $("#tank_1").stop().animate({
    //                 "top": pos.top,
    //                 "left": pos.left
    //                 }, 500);
}

Tank.prototype.go = function(direction){
    switch(direction){
        case 37:
            this.goLeft();
            break;
        case 38:
            this.goTop();
            break;
        case 39:
           this.goRight();
            break;
        case 40:
            this.goBottom();
            break;
    }
}

Tank.prototype.goLeft = function(){
    var leftElementState = this.topLeft.prev().data("state");
    var bottomElementState = $(".block[data-row=" + (this.topLeft.data("row") + 1) + "]")
                                .filter("[data-col=" + (this.topLeft.data("col") - 1) + "]")
                                .data("state");
    if(leftElementState == 0 && bottomElementState == 0){
        this.topLeft = this.topLeft.prev();
        console.log(this.topLeft);
        this.regenerate();
        this.turn("left");
    }
}

Tank.prototype.goRight = function(){
    var rightElementState = this.topLeft.next().next().data("state");
    var bottomElementState = $(".block[data-row=" + (this.topLeft.data("row") + 1) + "]")
                                .filter("[data-col=" + (this.topLeft.data("col") - 2) + "]")
                                .data("state");

    if(rightElementState == 0 && bottomElementState == 0){
        this.topLeft = this.topLeft.next();
        this.regenerate();
        this.turn("right");
    }
}

Tank.prototype.goTop = function(){
    var topElementState = $(".block[data-row=" + (this.topLeft.data("row") - 1) + "]")
                                .filter("[data-col=" + this.topLeft.data("col") + "]").data("state");

    var rightElementState = $(".block[data-row=" + (this.topLeft.data("row") - 1) + "]")
                                .filter("[data-col=" + this.topLeft.next().data("col") + "]").data("state");

    if(rightElementState == 0 && topElementState == 0){
        this.topLeft = $(".block[data-row=" + (this.topLeft.data("row") - 1) + "]")
                                .filter("[data-col=" + this.topLeft.data("col") + "]");
        this.regenerate();
        this.turn("top");
    }
}

Tank.prototype.goBottom = function(){
    var bottomElementState = $(".block[data-row=" + (this.topLeft.data("row") + 2) + "]")
                                .filter("[data-col=" + this.topLeft.data("col") + "]").data("state");

    var rightElementState = $(".block[data-row=" + (this.topLeft.data("row") + 2) + "]")
                                .filter("[data-col=" + this.topLeft.next().next().data("col") + "]").data("state");

    if(rightElementState == 0 && bottomElementState == 0){
        this.topLeft = $(".block[data-row=" + (this.topLeft.data("row") + 1) + "]")
                                .filter("[data-col=" + this.topLeft.data("col") + "]");
        this.regenerate();
        this.turn("bottom");
    }
}

Tank.prototype.turn = function(direction){
    this.direction = direction;
    var degrees = 0;
    switch(direction){
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

    $("#tank_1").css({'-webkit-transform' : 'rotate('+ degrees +'deg)',
             '-moz-transform' : 'rotate('+ degrees +'deg)',
             '-ms-transform' : 'rotate('+ degrees +'deg)',
             'transform' : 'rotate('+ degrees +'deg)'});
}

var tankEl = $(".tank");
var tank = new Tank(1, "tankcheto", 1, tankEl);
tank.generate();
$(document).keyup(function(event){
    if (event.which === 38 || event.which === 37 || event.which === 39 || event.which === 40) {
        tank.go(event.which);
    };
})