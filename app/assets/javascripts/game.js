(function(canvas) {
  var Player = function(myName) {
    var root = this;

    root.myName = myName;

    root.vx = 0;

    // quarter second
    root.reloadTime = 0.25;

    root.reload = root.reloadTime;

    root.maxVel = 200;

    root.step = function(game, frameRate, setup) {
      var position = setup(game, root);

      root.x = position.x;

      root.y = position.y;

      var myWidth = position.myWidth;

      if(game.keys['left']) {root.x -= root.maxVel * frameRate}
      else if(game.keys['right']) {root.x += root.maxVel * frameRate;}
      else {root.vx = 0;}

      if(root.x < 0) {
        root.x = 0;
      } else if(root.x > game.width - myWidth) {
        root.x = game.width - myWidth;
      }
    }

    // todo, root.myName get it locally
    root.draw = function(ctx) {
      spritesheet.draw(ctx, root.myName, root.x, root.y);
    }
  };

  var Enemy = function(myName, blueprint, override) {
    var root = this;

    root.myName = myName;

    root.blueprint = blueprint;

    root.override = override;

    root.step = function(game, frameRate, setup) {
      var params = setup();

      root.t = params.t;

      root.vx = params.vx;

      root.vy = params.vy;

      root.x = params.x;

      root.y = params.y;
    };

    root.draw = function(ctx, spritesheet) {
      spritesheet.draw(ctx, root.myName, root.x, root.y);
    };
  };

  // todo, scrolling background
  var Starfield = function(speed, clear) {
    var root = this;

    // draw off screen first
    var stars = document.createElement('canvas');

    var starsCtx = stars.getContext('2d');

    var offset = 0;

    // update starfield
    root.step = function(game, frameRate, setup) {
      var setup = setup(game, stars, starsCtx);

      stars = setup.stars;

      starsCtx = setup.starsCtx;

      offset += frameRate * speed;

      offset = offset % stars.height;
    };

    // this is called every frame
    // to draw starfield on to the canvas
    root.draw = function(ctx) {
      var intOffset = Math.floor(offset);

      var remaining = stars.height - intOffset;

      // draw the top half of the starfield
      if(intOffset > 0) {
        ctx.drawImage(stars, 0, remaining, stars.width, intOffset, 0, 0, stars.width, intOffset);
      }

      if(remaining > 0){
        ctx.drawImage(stars, 0, 0, stars.width, remaining, 0, intOffset, stars.width, remaining);
      }
    };
  };

  // game board
  // handles, contains sprites
  // layer of graphics, drawing happens here
  var Gameboard = function() {
    var root = this;

    // the current list of objects
    root.objects = [];

    // callbacks for setting up things
    root.setups = [];

    // add a new object to the object list
    root.add = function(thing, setup) {
      thing.board = this;
      
      root.objects.push(thing);

      root.setups.push(setup);

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

        var setup = root.setups[i];

        if(!i) args.push(setup);
        else {
          args.pop();
          args.push(setup);
        }

        // works on this with args as array
        obj[funcName].apply(obj, args);
      }
    };

    // does things in step
    root.step = function(game, frameRate) {
      root.resetRemoved();
      // for each thing call step
      root.iterate('step', game, frameRate);
      root.finalizeRemoved();
    };

    // calls draw on each thing
    root.draw = function(ctx, spritesheet) {
      root.iterate('draw', ctx, spritesheet);
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

    var KEY_CODES = {37: 'left', 39: 'right', 32: 'fire'};

    // keys actually pressed
    root.keys = {};

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
          boards[i].step(root, frameRate);

          boards[i].draw(root.ctx, root.spritesheet);
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

  var setups = {
    starfield: function(game, stars, starsCtx) {
      stars.width = game.width;

      stars.height = game.height;

      starsCtx.fillStyle = '#000';

      starsCtx.fillRect(0, 0, stars.width, stars.height);

      return {stars: stars, starsCtx: starsCtx};
    },
    ship: function(game, ship) {
      var mySprite = game.spritesheet.map[ship.myName],
      myWidth = mySprite.w,
      myHeight = mySprite.h,
      x = y = 0;

      if(typeof ship.x == 'undefined' || typeof ship.y == 'undefined') {
        x = game.width / 2 - myWidth / 2;

        y = game.height - 10 - myHeight;
      } else {
        x = ship.x;

        y = ship.y;
      }

      return {x: x, y: y, myWidth: myWidth};
    },
  };

  var game = new Game();

  game.setupInput();

  game.setupDrawing(canvas, spritesheet);

  var board = new Gameboard();

  board.add(new Starfield(1, true), setups.starfield);

  board.add(new Player('ship'), setups.ship);

  game.addBoard(board);

  spritesheet.load(sprites, game.loop);

})(document.getElementById('game'));
