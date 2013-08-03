// Globals. Nice!
var boardSizeCustom;
var board;
var level;
var levelText;
var boardSize;
var tileSize;
var fill = false;
var timer;
var gameStarted = false;
var startTime;

var debug = false;

var defaultSettings = {
    tileSize: 20
}

var tileState = {
    "exploded": 0,
    "none": 1,
    "flagged": 2,
    "clicked": 3
};

var tileType = {
    "free": 0,
    "bomb": 1
};

var btnColors = {
    //'flag': '#F0F',
    //'flag': '#D69200',
    'flag': '#FF506E',
    'none': '#C0C4AC',
    'exploded': 'red',
    "_0": "white",
    "_1": "#A7DBD8",
    "_2": "#69D2E7",
    "_3": "#49B2C7",
    "_4": "#87BBB8",
    "_5": "#F38630",
    "_6": "#C35610",
    "_7": "#F38630",
    "_8": "#F38630"
};

$(function() {
    determineLevel();
    createUI();
    //initGame();
});

// Stolen from stack-overflow
function getQueryParams(qs) {
    qs = qs.split("+").join(" ");

    var params = {}, tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])]
            = decodeURIComponent(tokens[2]);
    }
    return params;
}

function Board(size, mines) {
    var self = this;
    self.boardSize = size;
    self.board = [];
    self.flags = 0;
    self.mines = mines;
    self.clicked = 0;
    var i, j;
      
    this.createBoard = function(x, y) {
        self.createEmptyBoard();
        jlog("Empty board created. Inserting " + self.mines + " mines");
        self.insertMines(x, y);
        jlog("Mines inserted. Updating mine count");
        self.updatemineCount();
    };
    
    this.createEmptyBoard = function() {
        for(i = 0; i < self.boardSize.x; i++) {
            if(!self.board[i]) self.board[i] = [];
            for(j = 0; j < self.boardSize.y; j++) {
                self.board[i][j] = new Tile();
                self.board[i][j].minesClose = 0;
                self.board[i][j].type = tileType.free;
                self.board[i][j].state = tileState.none;
            }
        }
    };
    
    this.insertMines = function(avoid) {
        var currentMines = 0;
        while(currentMines < self.mines) {
            var px = Math.floor(Math.random() * self.boardSize.x);
            var py = Math.floor(Math.random() * self.boardSize.y);
            
            var cont = false;
            for(var i = 0; i < avoid.length; i++) {
                if(px == avoid[i].x && py == avoid[i].y)
                {
                    cont = true;
                    break;
                }
            }
            
            if(cont)
                continue;
            
            if(self.board[px][py].type == tileType.bomb) {
                continue;
            }
            
            self.board[px][py].type = tileType.bomb;
            currentMines++;
        }
    };
    
    this.addMineTo = function(x, y) {
        try {
            var tile = self.board[x][y];
            if(tile.minesClose > -1)
                tile.minesClose++;
        }catch(e){}
    };
    
    this.updatemineCount = function() {
        for(i = 0; i < self.boardSize.x; i++) {
            for(j = 0; j < self.boardSize.y; j++) {
                if(self.board[i][j].type == tileType.free)
                    continue;
                
                var ip1 = parseInt(i) + 1;
                var jp1 = parseInt(j) + 1;
                var im1 = parseInt(i) - 1;
                var jm1 = parseInt(j) - 1;
                
                self.addMineTo(ip1, j);
                self.addMineTo(i, jp1);
                self.addMineTo(im1, j);
                self.addMineTo(i, jm1);
                self.addMineTo(ip1, jp1);
                self.addMineTo(im1, jm1);
                self.addMineTo(ip1, jm1);
                self.addMineTo(im1, jp1);
            }
        }
    };
    this.flagsSurrounding = function(x, y) {
        var count = 0;
        
        var xp1 = parseInt(x) + 1;
        var yp1 = parseInt(y) + 1;
        var xm1 = parseInt(x) - 1;
        var ym1 = parseInt(y) - 1;
        
        if(self.isFlagged(xp1,y)) count++;
        if(self.isFlagged(x,yp1)) count++;
        if(self.isFlagged(xm1,y)) count++;
        if(self.isFlagged(x,ym1)) count++;
        if(self.isFlagged(xp1,yp1)) count++;
        if(self.isFlagged(xm1,ym1)) count++;
        if(self.isFlagged(xp1,ym1)) count++;
        if(self.isFlagged(xm1,yp1)) count++;
        
        return count;
    };
    
    this.clickSurrounding = function(x,y) {
        // ParseInt fordi den tok x og/eller y som string...
        // MADDAFAKK
        var xp1 = parseInt(x) + 1;
        var yp1 = parseInt(y) + 1;
        var xm1 = parseInt(x) - 1;
        var ym1 = parseInt(y) - 1;
        
        self.tryClick(xp1,y);
        self.tryClick(x,yp1);
        self.tryClick(xm1,y);
        self.tryClick(x,ym1);
        self.tryClick(xp1,yp1);
        self.tryClick(xm1,ym1);
        self.tryClick(xm1,yp1);
        self.tryClick(xp1,ym1);
    };  
    
    this.clickUnclickedSurrounding = function(x,y) {
        var xp1 = parseInt(x) + 1;
        var yp1 = parseInt(y) + 1;
        var xm1 = parseInt(x) - 1;
        var ym1 = parseInt(y) - 1;
        
        self.tryClickUnclicked(xp1,y);
        self.tryClickUnclicked(x,yp1);
        self.tryClickUnclicked(xm1,y);
        self.tryClickUnclicked(x,ym1);
        self.tryClickUnclicked(xp1,yp1);
        self.tryClickUnclicked(xm1,ym1);
        self.tryClickUnclicked(xm1,yp1);
        self.tryClickUnclicked(xp1,ym1);
    };  
    
    this.unclickedSurroundings = function(x, y) {
        var count = 0;
        
        var xp1 = parseInt(x) + 1;
        var yp1 = parseInt(y) + 1;
        var xm1 = parseInt(x) - 1;
        var ym1 = parseInt(y) - 1;
        
        if(self.isUnclicked(xp1,y)) count++;
        if(self.isUnclicked(x,yp1)) count++;
        if(self.isUnclicked(xm1,y)) count++;
        if(self.isUnclicked(x,ym1)) count++;
        if(self.isUnclicked(xp1,yp1)) count++;
        if(self.isUnclicked(xm1,ym1)) count++;
        if(self.isUnclicked(xp1,ym1)) count++;
        if(self.isUnclicked(xm1,yp1)) count++;
        
        return count;
    };
    
    this.isFlagged = function(x,y) {
        var tile = self.tryGet(x,y);
        if(!tile) return false;
        return tile.state == tileState.flagged;
    };
    
    self.selected = { x: 0, y: 0};
    
    this.isUnclicked = function(x,y) {
        var tile = self.tryGet(x,y);
        if(!tile) { 
            jlog(x + " " + y + " is not a tile");
            return false;
        }
        return tile.state == tileState.none;
    };
    
    this.selectTile = function(x, y) {
        if(self.selected)
            $(self.getButton(self.selected.x, self.selected.y)).css('border', defaultBorders.none);
        self.selected = { x: x, y: y};  
        $(self.getButton(x, y)).css('border', defaultBorders.hover);
    };
    
    this.firstClick = function(x, y) {
        
        x = parseInt(x);
        y = parseInt(y);
        var btn = self.getButton(x,y);
        
        var avoid = new Array(
            {x: x, y: y},
            {x: x+1, y: y},
            {x: x, y: y+1},
            {x: x-1, y: y},
            {x: x, y: y-1},
            {x: x-1, y: y-1},
            {x: x+1, y: y+1},
            {x: x-1, y: y+1},
            {x: x+1, y: y-1}
        );
        self.insertMines(avoid);
        self.updatemineCount();
        
        self.click = self.defaultClick;
        self.click(x, y, btn);
    };
    
    this.defaultClick = function(x, y) {
        var tile = self.board[x][y];
        
        switch(tile.state) {
            case tileState.clicked:
                if(tile.minesClose === 0)
                    return;
                // Åpne alle rundt dersom det er nok flagg.
                var surr = self.flagsSurrounding(x, y);
                var unclickedSurr = self.unclickedSurroundings(x,y)
                jlog("UM: " + unclickedSurr + " " + tile.minesClose);
                if(surr == tile.minesClose && unclickedSurr > 0) {
                    jlog("Mines Close: " + tile.minesClose);
                    self.clickUnclickedSurrounding(x, y);
                }
                return;
            case tileState.none:
                if(tile.type == tileType.bomb) {
                    self.triggerAllMines();
                    self.onGameOver();
                }else {
                    tile.state = tileState.clicked;
                    $(tile.btn).css('disabled', true)
                        .text(tile.minesClose===0?"":tile.minesClose)
                        .css('background-color', self.determineButtonColor(tile.minesClose));
                    
                    if(tile.minesClose === 0) {
                        self.clickSurrounding(x, y);
                    }
                    self.clicked++;
                }
                return;
            case tileState.flagged:
            case tileState.exploded:
                return;
        }
    };
    
    this.triggerAllMines = function() {
        for(i = 0; i < self.boardSize.x; i++) {
            for(j = 0; j < self.boardSize.y; j++) {
                if(self.board[i][j].type == tileType.bomb 
                    && self.board[i][j].state != tileState.flagged) {
                    $(self.board[i][j].btn)
                        .css('background-color', btnColors.exploded);
                }
            }
        }
    };
    
    this.determineButtonColor = function(minesClose) {
        var color = btnColors._0;
        eval("color = btnColors._" + minesClose);
        return color;
    };
    
    this.tryGet = function(x, y) {
        x = parseInt(x);
        y = parseInt(y);
        
        if(x < 0 || x >= self.boardSize.x || y < 0 || y >= self.boardSize.y) {
            return null;
        }
        return self.board[x][y];
    };
    
    this.tryClick = function(x, y) {
        var tile = this.tryGet(x,y);
        if(!tile)
            return;
        self.click(x, y, tile.btn);
    };
    
    this.tryClickUnclicked = function(x, y) {
        var tile = this.tryGet(x,y);
        jlog("TryClick: " + x + ","+y+": ");
        if(!tile)
            return;
        if(tile.state != tileState.none)
            return;
        self.click(x, y, tile.btn);
    };
    
    this.flag = function(x, y) {
        var tile = self.board[x][y];
        if(tile.state == tileState.flagged) {
            jlog("un-flagging: " + x + " " + y);
            tile.state = tileState.none;
            $(tile.btn).css('background-color', btnColors.none);
            self.flags--;
        }
        else if(tile.state == tileState.none) {
            tile.state = tileState.flagged;
            jlog("flagging: " + x + " " + y);
            $(tile.btn).css('background-color', btnColors.flag);
            self.flags++;
        }
        self.setTitle();
    };
    
    this.setTitle = function() {
        document.title = "JS: " + self.flags + "/" + self.mines;
    };
    
    this.getButton = function(x, y) {
        return self.board[x][y].tile;  
    };
    
    this.gameOver = function() {
        alert("GAME OVER!");
    };
    
    self.click = self.firstClick;
    self.createEmptyBoard();
    self.setTitle();
} // class Board

function Tile() {
    this.type = tileType.free;
    this.state = tileState.none;
    this.minesClose = 0;
}
function buildTable(board) {
    var table = $("#sveip_content");
    for(var i = 0; i < board.boardSize.x; i++) {
        var tr = $("<tr>");
        
        for(var j = 0; j < board.boardSize.y; j++) {
            var td = $("<td>").appendTo(tr);
            var btn = $("<button>").attr({'x':i , 'y': j})
                .addClass("minebtn").appendTo(td)
                .mouseup(mineOnClick);
            board.board[i][j].btn = btn;
        }
        $(tr).appendTo(table);
    }
    $(".minebtn").bind('contextmenu', function(e){ return false; })
        .css('width', getTileSize())
        .css('height', getTileSize())
        .css('font-size', getTileSize()-4)
        .css('background-color', btnColors.none);
}

function mineOnClick(event) {
    jlog($(event.target).attr('x') + " " + $(event.target).attr('y'));
                    
    if(!gameStarted) {
        gameStarted = true;
        startTime = (new Date()).getTime();
    }
    
    switch(event.which) {
        case 1: // Left click
            board.click($(event.target).attr('x'), $(event.target).attr('y'));
            // Check win
            if(board.clicked == (board.boardSize.x*board.boardSize.y)-board.mines) {
                board.onGameWon();
            }
            break;
        case 3: // RightClick
            board.flag($(event.target).attr('x'), $(event.target).attr('y'));
            break;
    }
    return true;
}

setInterval(function() {
   if(gameStarted) timer++; 
}, 1000);

function getLevelFromText(txt) {
    switch(txt) {
        case "easy":
            return 0;
        case "medium":
            return 1;
        case "hard":
            return 2;
        case "extreme":
            return 3;
        default:
            return 0;
    }
}
var boardSizeSet;
function determineLevel() {
    jlog("Fetching level parameters");
    //console.log(document.location.search);
    var params = getQueryParams(document.location.search);
    
    var ts = params.tileSize;
    if(!ts)
        tileSize = defaultSettings.tileSize;
    else
        tileSize = ts;
        
    jlog("tile size: " + tileSize);
    
    levelText = params.level;
    if(!levelText)
        level = 0;
    else
        level = getLevelFromText(levelText);
    jlog("difficulty: " + level);
    
    var sx = params.x;
    var sy = params.y;
    
    if(!sx || !sy) {
        boardSize = getBoardSize();
        boardSizeSet = false;
    }
    else {
        boardSize = { 'x': sy, 'y': sx };
        boardSizeSet = true;
    }
    
    jlog("board size: " + boardSize.x + " " + boardSize.y);
    jlog("done fetching level parameters");
}
function getBoardSize() {
    var y = Math.floor($(window).width() / getTileSize());
    var x = Math.floor($(window).height() / getTileSize());
    return { 'x': x, 'y': y };
}

function initGame() {
    // Reset timer
    timer = 0;
    
    $("#sveip_content").empty();
    var mines = Math.floor((boardSize.x * boardSize.y) / (3*(4-level)));
    
    board = new Board(boardSize, mines);
    
    board.onGameOver = function() {
        gameStarted = false;
        newGameDialog("Game Over", "Game over");
    };
    
    board.onGameWon = function() {
        gameStarted = false;
        var endTime = new Date().getTime();
        console.log(startTime + " - " + endTime);
        console.log(endTime-startTime);
        newGameDialog("YAAAAY", "You did it in " + getTime(endTime - startTime));
    };
    
    buildTable(board);
}

function getTime(millis) {
    var ms = millis%1000;
    millis = (millis-ms)/1000;
    var s = millis % 60;
    millis = (millis-s)/60;
    var m = millis % 60;
    millis = (millis-m)/60;
    var h = millis % 60;
    
    var str = "";
    
    if(h > 0)
        str += h + "h ";
    
    str += m + "m ";
    str += s + "s ";
    str += ms + "ms.";
    return str;
}


function newGameDialog(title, message) {
    var msg = $("<p>").text(message);
    var div = $( "<div>" ).attr('title', title).html(msg).attr('id','dialog');
     $(div).dialog(
         {modal: true, buttons: 
            { 'New Game': function() {
                $(div).dialog('close');
                initGame();
            }, 'Settings': function() {
                $(div).dialog('close');
                createUI();
            }
        }
    });
}
function jlog(message) {
    if(debug) {
        console.log(message);
    }
}
function getTileSize() {
    return tileSize;
}
function createUI() {
    $("select[name='level']").val(levelText);
    $("#tileSizeValue").html(getTileSize());
    
    $("#slider").slider({min: 10, max: 50, value: getTileSize(),
        slide: function(event, ui) {
            $("#tileSizeValue").html(ui.value);
            tileSize = ui.value;
            boardSize = getBoardSize();
            if(fill) {
                var bs = getBoardSize();
                $("#boardSizeContent").html("X: " + bs.x + "<br/>Y: " + bs.y);
            }
        }
    });
    
    $("#boardType").buttonset();
    
    if(!boardSizeCustom)
        boardSizeCustom = $("#boardSizeCustom");
    
    $("input[name=boardSize]").on('change', function() {
        if($(this).val() == 'Fill') {
            var bs = getBoardSize();
            $("#boardSizeContent").html("X: " + bs.x + "<br/>Y: " + bs.y);
            fill = true;
        } 
        else if($(this).val() == 'Custom') {
            $("#boardSizeContent").html(boardSizeCustom);
            setupSpinners();
            fill = false;
        }
    });
    
    $("#boardSizeContent").html(boardSizeCustom);
    
    $("#settings").dialog({modal: true, buttons: { Ok: function() {
        // On OK
        level = getLevelFromText($("select[name='level']").val());
        if(fill) {
            boardSize = getBoardSize();
        } else {
            var xVal = $("#inputBoardSizeY").spinner('value');
            var yVal = $("#inputBoardSizeX").spinner('value');
            boardSize = {x: xVal, y: yVal};
        }
        initGame();
        
        // Set URL
        
        var url = document.URL.split("?")[0] + 
                "?level=" + $("select[name='level']").val() + 
                "&x=" + boardSize.y + 
                "&y=" + boardSize.x + 
                "&tileSize=" + tileSize;
        
        window.history.pushState("sumthn", "", url);
        
        board.setTitle();
        $(this).dialog("close");
    }}});
    
    if(boardSizeSet) {
        setupSpinners();
        fill = false;
    }else {
        var bs = getBoardSize();
        $("#boardSizeContent").html("X: " + bs.x + "<br/>Y: " + bs.y);
        fill = true;
    }
}
function setupSpinners() {
    $("#inputBoardSizeX").spinner().spinner('value', boardSize.y );
    $("#inputBoardSizeY").spinner().spinner('value', boardSize.x );
}