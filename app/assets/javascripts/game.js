(function(canvas) {
  // create explosions
  var FactoryExplosion = function(myName, type, x, y, frames, currentFrame) {
    var Explosion = function(myName, type, x, y, frames, startingFrame) {
      var root = this;

      root.myName = myName;

      root.type = type;

      root.x = x;

      root.y = y;

      root.frames = frames;

      root.useFrames = {};

      root.startingFrame = root.currentFrame = startingFrame;

      root.presetFrames = function(frames, startingFrame) {
        for(var i = startingFrame; i < frames; i++) {
          root.useFrames[i] = root.myName + i;
        }
      };

      root.step = function(game, frameRate, board) {
        var mySprite = game.spritesheet.map[root.useFrames[root.currentFrame]];

        root.width = mySprite.w;

        root.height = mySprite.h;

        if(root.currentFrame >= root.frames - 1) board.remove(root);

        root.currentFrame++;
      };

      root.draw = function(ctx, spritesheet) {
        spritesheet.draw(ctx, root.useFrames[root.currentFrame], root.x, root.y);
      };

      root.collide = function(root, board) {};

      root.presetFrames(root.frames, root.startingFrame);
    };

    return new Explosion(myName, type, x, y, frames, currentFrame);
  };

  // make player missile
  var FactoryPlayerMissile = function(myName, type, x, y, vy) {
    var PlayerMissile = function(myName, type, x, y, vy) {
      var root = this;

      root.myName = myName;

      root.type = type;

      root.x = x;

      root.y = y;

      root.vy = vy;

      root.step = function(game, frameRate, board) {
        var mySprite = game.spritesheet.map[root.myName];

        root.width = mySprite.w;

        root.height = mySprite.h;

        root.y += root.vy * frameRate;

        if(root.y < 0) board.remove(root);
      };

      root.draw = function(ctx, spritesheet) {
        spritesheet.draw(ctx, root.myName, root.x, root.y);
      };

      root.collide = function(root, board) {};
    };

    return new PlayerMissile(myName, type, x, y, vy);
  };

  // todo, single entry to object, e.g. call
  var Player = function(myName, type, maxVel, alive, addMissile, addExplosion, explosionFrames) {
    var root = this;

    root.myName = myName;

    root.type = type;

    root.maxVel = maxVel;

    root.alive = alive;

    root.addMissile = addMissile;

    root.addExplosion = addExplosion;

    root.explosionFrames = explosionFrames;

    root.fire = function(myName, type, x, y, vy, width, board, addMissile, count) {
      for(var i = 0, shift = 0; i < count; i++) {
        var missile = addMissile(myName, type, x + shift, y, vy);

        board.add(missile, function() {});

        shift += width;
      }
    };

    root.explode = function(name, type, board, x, y, addExplosion, frames) {
      var exp = addExplosion(name, type, x, y, frames, 0);

      board.add(exp, function() {});
    };

    root.step = function(game, frameRate, board) {
      var mySprite = game.spritesheet.map[root.myName];

      root.width = mySprite.w;

      root.height = mySprite.h;

      if(typeof root.x === 'undefined') {

        root.x = game.width / 2 - root.width / 2;

        root.y = game.height - 10 - root.height;
      }

      if(game.keys['left']) {root.x -= root.maxVel * frameRate}
      else if(game.keys['right']) {root.x += root.maxVel * frameRate;}
      else {root.vx = 0;}

      if(root.x < 0) {
        root.x = 0;
      } else if(root.x > game.width - root.width) {
        root.x = game.width - root.width;
      }

      // todo, observer or helper here
      if(game.keys['fire']) root.fire('missile', 'missile', root.x, root.y, -700, root.width, board, root.addMissile, 2);
    }

    // todo, root.myName get it locally
    root.draw = function(ctx) {
      spritesheet.draw(ctx, root.myName, root.x, root.y);
    }

    // check if this collides with something
    root.collide = function(game, board, setup) {
      for(var i = 0, len = board.objects.length; i < len; i++) {
        var current = board.objects[i];

        if(current.type === 'enemy' ) {
          var objectca = root.x + root.height / 2,
          objectcb = root.y + root.height / 2,
          currentca = current.x + current.height / 2,
          currentcb = current.y + current.height / 2;

          var sumRadius = root.height / 2 + current.height / 2;

          var distance = Math.floor(Math.sqrt(Math.pow(objectca - currentca, 2) + Math.pow(objectcb - currentcb, 2)));

          if(distance <= sumRadius && root.alive) {
            board.remove(root);

            root.explode('explosion', 'explosion', board, root.x, root.y, root.addExplosion, root.explosionFrames);

            root.alive = !root.alive;
          }
        }
      }
    }
  };

  var Enemy = function(myName, type, blueprint, alive, defaults, addExplosion, explosionFrames) {
    var root = this;

    root.myName = myName;

    root.type = type;

    root.blueprint = blueprint;

    root.alive = alive;

    root.defaults = (typeof defaults === 'undefined' || typeof defaults.x === 'undefined') ? {x: 0, y: 0, A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0} : defaults;

    root.addExplosion = addExplosion;

    root.explosionFrames = explosionFrames;

    root.explode = function(name, type, board, x, y, addExplosion, frames) {
      var exp = addExplosion(name, type, x, y, frames, 0);

      board.add(exp, function() {});
    };

    root.step = function(game, frameRate, board) {
      var mySprite = game.spritesheet.map[root.myName];

      root.width = mySprite.w;

      root.height = mySprite.h;

      for(var i in root.blueprint) root.defaults[i] = root.blueprint[i];

      if(typeof root.x === 'undefined') {
        root.x = root.defaults.x; root.y = root.defaults.y; root.t = 0;
      }

      root.t += frameRate;

      var vx = root.defaults.A + root.defaults.B * Math.sin(root.defaults.C * root.t + root.defaults.D),
      vy = root.defaults.E + root.defaults.F * Math.sin(root.defaults.G * root.t + root.defaults.H);

      root.x = root.x + frameRate * vx;

      root.y = root.y + frameRate * vy;

      if(root.y > game.height) board.remove(root);
    };

    root.draw = function(ctx, spritesheet) {
      spritesheet.draw(ctx, root.myName, root.x, root.y);
    };

    root.collide = function(game, board, setup) {
      for(var i = 0, len = board.objects.length; i < len; i++) {
        var current = board.objects[i];

        if(current.type === 'missile' ) {
          var objectca = root.x + root.height / 2,
          objectcb = root.y + root.height / 2,
          currentca = current.x + current.height / 2,
          currentcb = current.y + current.height / 2;

          var sumRadius = root.height / 2 + current.height / 2;

          var distance = Math.floor(Math.sqrt(Math.pow(objectca - currentca, 2) + Math.pow(objectcb - currentcb, 2)));


          if(distance <= sumRadius && root.alive) {
            board.remove(root);

            root.explode('explosion', 'explosion', board, root.x, root.y, root.addExplosion, root.explosionFrames);

            root.alive = !root.alive;
          }
        }
      }
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
    root.step = function(game, frameRate, board, setup) {
      stars.width = game.width;

      stars.height = game.height;

      starsCtx.fillStyle = '#000';

      starsCtx.fillRect(0, 0, stars.width, stars.height);

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

    root.collide = function(game, board) {};
  };

  // game board
  // handles, contains sprites
  // layer of graphics, drawing happens here
  var Gameboard = function() {
    var root = this;

    // the current list of objects
    root.objects = [];

    // things to be removed
    root.removed = [];

    // add a new object to the object list
    root.add = function(thing) {
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

        if(idx > -1) {
          root.objects.splice(idx, 1);
        }
      }
    };

    // call on every thing
    root.iterate = function(funcName) {
      var args = Array.prototype.slice.call(arguments, 1);

      for(var i = 0, len = root.objects.length; i < len; i++) {
        var obj = root.objects[i];

        // works on this with args as array
        obj[funcName].apply(obj, args);
      }
    };

    // does things in step
    root.step = function(game, frameRate) {
      root.resetRemoved();

      // for each thing call step
      root.iterate('step', game, frameRate, root);

      root.finalizeRemoved();
    };

    root.collide = function(game) {
      root.iterate('collide', game, root);
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

    // whether a game is running
    root.running = true;

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
          boards[i].resetRemoved();

          boards[i].step(root, frameRate);

          boards[i].collide(root);

          boards[i].finalizeRemoved();

          boards[i].draw(root.ctx, root.spritesheet);
        }
      }

      console.log('looping');

      if(root.running) setTimeout(root.loop, frames);
    };

    root.setRunning = function(value) {
      root.running = value;
    };
  };

  // sprites i have
  var sprites = {
    ship: {sx: 0, sy: 0, w: 37, h: 42, frames: 1},
    missile: {sx: 0, sy: 30, w: 2, h: 10, frames: 1},
    enemyPurple: {sx: 37, sy: 0, w: 42, h: 43, frames: 1},
    explosion0: { sx: 0, sy: 64, w: 64, h: 64, frames: 1},
    explosion1: { sx: 64, sy: 64, w: 64, h: 64, frames: 1},
    explosion2: { sx: 128, sy: 64, w: 64, h: 64, frames: 1},
    explosion3: { sx: 192, sy: 64, w: 64, h: 64, frames: 1},
    explosion4: { sx: 256, sy: 64, w: 64, h: 64, frames: 1},
    explosion5: { sx: 320, sy: 64, w: 64, h: 64, frames: 1},
    explosion6: { sx: 384, sy: 64, w: 64, h: 64, frames: 1},
    explosion7: { sx: 448, sy: 64, w: 64, h: 64, frames: 1},
    explosion8: { sx: 512, sy: 64, w: 64, h: 64, frames: 1},
    explosion9: { sx: 572, sy: 64, w: 64, h: 64, frames: 1},
    explosion10: { sx: 636, sy: 64, w: 64, h: 64, frames: 1},
    explosion11: { sx: 700, sy: 64, w: 64, h: 64, frames: 1}
  };

  // behaviour of enemies
  var enemies = {
    basic0: {x: 0, y: -50, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic1: {x: 50, y: -50, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic2: {x: 100, y: -50, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic3: {x: 150, y: -50, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic4: {x: 200, y: -50, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic5: {x: 250, y: -50, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic6: {x: 300, y: -50, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic7: {x: 350, y: -50, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic8: {x: 0, y: -150, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic9: {x: 50, y: -150, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic10: {x: 100, y: -150, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic11: {x: 150, y: -150, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic12: {x: 200, y: -150, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic13: {x: 250, y: -150, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic14: {x: 300, y: -150, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic15: {x: 350, y: -150, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic16: {x: 0, y: -250, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic17: {x: 50, y: -250, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic18: {x: 100, y: -250, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic19: {x: 150, y: -250, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic20: {x: 200, y: -250, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic21: {x: 250, y: -250, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic22: {x: 300, y: -250, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic23: {x: 350, y: -250, sprite: 'enemyPurple', B: 100, C: 2, E: 100}
  };

  var game = new Game();

  game.setupInput();

  game.setupDrawing(canvas, spritesheet);

  var background = new Gameboard();

  background.add(new Starfield(1, true));

  game.addBoard(background);

  var level0 = new Gameboard();

  level0.add(new Player('ship', 'ship', 200, true, FactoryPlayerMissile, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic0, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic1, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic2, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic3, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic4, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic5, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic6, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic7, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic8, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic9, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic10, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic11, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic12, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic13, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic14, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic15, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic16, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic17, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic18, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic19, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic20, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic21, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic22, true, {}, FactoryExplosion, 12));

  level0.add(new Enemy('enemyPurple', 'enemy', enemies.basic23, true, {}, FactoryExplosion, 12));

  game.addBoard(level0);

  spritesheet.load(sprites, game.loop);

})(document.getElementById('game'));
