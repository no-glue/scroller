(function(canvas) {
  var Player = function(myName) {
    var root = this;

    root.myName = myName;

    root.vx = 0;

    // quarter second
    root.reloadTime = 0.25;

    root.reload = root.reloadTime;

    root.maxVel = 200;

    root.step = function(_frameRate) {
    }

    root.draw = function(ctx, spritesheet, gameWidth, gameHeight) {
      var mySprite = spritesheet.map[root.myName],
      w = mySprite.w,
      h = mySprite.h,
      x = gameWidth / 2 - w / 2,
      y = gameHeight - 10 - h;

      spritesheet.draw(ctx, root.myName, x, y, mySprite.frames);
    }
  };

  // game board
  // handles, contains sprites
  // layer of graphics, drawing happens here
  var Gameboard = function() {
    var root = this;

    // the current list of objects
    root.objects = [];

    // add a new object to the object list
    root.add = function(thing) {
      thing.board = this;
      
      root.objects.push(thing);

      return thing;
    };

    // remove object
    root.remove = function(thing) {
      root.removed.push(thing);
    };

    // clear removed things
    root.resetRemoved = function() {
      root.removed = [];
    };

    // finally remove objects
    root.finalizeRemoved = function() {
      for(var i=0, len = root.removed.length; i < len; i++) {
        var idx = root.objects.indexOf(root.removed[i]);

        if(idx > -1) root.objects.splice(idx, 1);
      }
    };

    // call on every thing
    root.iterate = function(funcName) {
      var args = Array.prototype.slice.call(arguments, 1);

      for(var i=0, len = root.objects.length; i < len; i++) {
        var obj = root.objects[i];

        // works on this with args as array
        obj[funcName].apply(obj, args);
      }
    };

    // does things in step
    root.step = function(frameRate) {
      root.resetRemoved();
      // for each thing call step
      root.iterate('step', frameRate);
      root.finalizeRemoved();
    };

    // calls draw on each thing
    root.draw = function(ctx, spritesheet, gameWidth, gameHeight) {
      root.iterate('draw', ctx, spritesheet, gameWidth, gameHeight);
    };
  };

  // can have only one spritesheet
  var spritesheet = new function() {
    var root = this;

    root.map = {};

    root.load = function(spriteData, callback) {
      root.map = spriteData;

      root.image = new Image();

      root.image.onload = callback;

      root.image.src = '/assets/sprites.png';
    };

    root.draw = function(ctx, sprite, x, y, frame) {
      var s = root.map[sprite];

      if(!frame) frame = 0;

      ctx.drawImage(root.image, s.sx, s.sy, s.w, s.h, Math.floor(x), Math.floor(y), s.w, s.h);
    };
  };

  // running the game, should have only one
  // todo, somehow make only one
  var Game = function() {
    var root = this;

    // game loop
    var boards = [];

    var KEY_CODES = {};

    // work with keys
    root.setupInput = function() {
      window.addEventListener('keydown', function(e) {
        e.preventDefault();

        var keyCode = e.keyCode;

        if(KEY_CODES[keyCode]) root.keys[KEY_CODES[keyCode]] = true;
      }, false);

      window.addEventListener('keyup', function(e) {
        e.preventDefault();

        var keyCode = e.keyCode;

        if(KEY_CODES[keyCode]) root.keys[KEY_CODES[keyCode]] = false;
      }, false);
    };

    root.setupDrawing = function(canvas, spritesheet) {
      root.canvas = canvas;

      root.width = root.canvas.width;

      root.height = root.canvas.height;

      root.ctx = root.canvas.getContext('2d');

      root.spritesheet = spritesheet;
    };

    root.addBoard = function(board) {
      boards.push(board);
    };

    // game loop
    // everything happens here
    root.loop = function () {
      var frames = 30;

      var frameRate = frames / 1000;

      for(var i=0, len = boards.length; i < len; i++) {
        if(boards[i]) {
          boards[i].draw(root.ctx, root.spritesheet, root.width, root.height);
        }
      }

      console.log('looping');

      setTimeout(root.loop, frames);
    };
  };

  // sprites i have
  var sprites = {
    ship: {sx: 0, sy: 0, w: 37, h: 42, frames: 1}
  };

  var game = new Game();

  game.setupInput();

  game.setupDrawing(canvas, spritesheet);

  var board = new Gameboard();

  board.add(new Player('ship'));

  game.addBoard(board);

  spritesheet.load(sprites, game.loop);

})(document.getElementById('game'));
