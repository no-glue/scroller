(function(canvas) {
  // create explosions
  var FactoryExplosion = function(myName, type, x, y, frames, currentFrame) {
    var Explosion = function(myName, type, x, y, frames, currentFrame) {
      var root = this;

      root.baseName = myName;

      root.myName = myName + currentFrame;

      root.type = type;

      root.x = x;

      root.y = y;

      root.frames = frames;

      root.currentFrame = currentFrame + 1;

      root.step = function(game, frameRate, board, setup) {
        var mySprite = game.spritesheet.map[root.myName];

        root.width = mySprite.w;

        root.height = mySprite.h;

        if(root.currentFrame >= root.frames) board.remove(root);

        root.myName = root.baseName + root.currentFrame;

        root.currentFrame++;
      };

      root.draw = function(ctx, spritesheet) {
console.log('explode draw', root.myName, myName);
        spritesheet.draw(ctx, root.myName, root.x, root.y);
      };

      root.collide = function(root, board) {};
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

      root.step = function(game, frameRate, board, setup) {
        var params = setup(game, root);

        root.width = params.myWidth;

        root.height = params.myHeight;

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

  var Player = function(myName) {
    var root = this;

    root.myName = myName;

    root.vx = 0;

    // quarter second
    root.reloadTime = 0.25;

    root.reload = root.reloadTime;

    root.maxVel = 200;

    root.alive = true;

    root.step = function(game, frameRate, board, setup) {
      var position = setup.setup(game, root);

      root.x = position.x;

      root.y = position.y;

      root.width = position.myWidth;

      root.height = position.myHeight;

      if(game.keys['left']) {root.x -= root.maxVel * frameRate}
      else if(game.keys['right']) {root.x += root.maxVel * frameRate;}
      else {root.vx = 0;}

      if(root.x < 0) {
        root.x = 0;
      } else if(root.x > game.width - root.width) {
        root.x = game.width - root.width;
      }

      if(game.keys['fire']) setup.addMissiles('missile', 'missile', root.x, root.y, -700, root.width, board, setup.fire, 2);
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

            setup.explode(board, root.x, root.y, setup.addExplosion, 12);

            root.alive = !root.alive;
          }
        }
      }
    }
  };

  var Enemy = function(myName, type, blueprint) {
    var root = this;

    root.myName = myName;

    root.type = type;

    root.blueprint = blueprint;

    root.alive = true;

    root.step = function(game, frameRate, board, setup) {
      var params = setup.setup(game, root, frameRate, setup.set);

      root.t = params.t;

      root.x = params.x;

      root.y = params.y;

      root.width = params.myWidth;

      root.height = params.myHeight;

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

            setup.explode(board, root.x, root.y, setup.addExplosion, 12);

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

    root.collide = function(game, board) {};
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

    // things to be removed
    root.removed = [];

    // add a new object to the object list
    root.add = function(thing, setup) {
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

        if(idx > -1) {
          root.objects.splice(idx, 1);

          root.setups.splice(idx, 1);
        }
      }
    };

    // call on every thing
    root.iterate = function(funcName) {
      var args = Array.prototype.slice.call(arguments, 1);

      for(var i = 0, len = root.objects.length; i < len; i++) {
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
      root.iterate('step', game, frameRate, root);

      root.iterate('collide', game, root);

      root.finalizeRemoved();
    };

    // calls draw on each thing
    root.draw = function(ctx, spritesheet) {
      root.iterate('draw', ctx, spritesheet);
    };

    // end the game
    root.end = function() {
      for(var i = 0, len = root.objects.length; i < len; i++) {
        var object = root.objects[i];

        root.remove(object);
      }

      root.finalizeRemoved();
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
console.log('sprite', sprite);
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
          boards[i].step(root, frameRate);

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
    basic0: {x: 100, y: -50, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic1: {x: 150, y: -50, sprite: 'enemyPurple', B: 100, C: 2, E: 100},
    basic2: {x: 200, y: -50, sprite: 'enemyPurple', B: 100, C: 2, E: 100}
  };

  // things to share
  var share = {
      explode: function(board, x, y, explosion, number) {
        var exp = explosion('explosion', 'explosion', x, y, number, 0);
console.log('make exp', exp);

        board.add(exp, function() {});
      }
  };

  var setups = {
    starfield: function(game, stars, starsCtx) {
      stars.width = game.width;

      stars.height = game.height;

      starsCtx.fillStyle = '#000';

      starsCtx.fillRect(0, 0, stars.width, stars.height);

      return {stars: stars, starsCtx: starsCtx};
    },
    ship: {
      setup: function(game, ship) {
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

        return {x: x, y: y, myWidth: myWidth, myHeight: myHeight};
      },
      fire: FactoryPlayerMissile,
      addMissiles: function(myName, type, x, y, vy, width, board, fire, count) {
        var setup = function(game, missile) {
          var mySprite = game.spritesheet.map[missile.myName];

          return {myWidth: mySprite.w, myHeight: mySprite.h};
        };

        for(var i = 0, shift = 0; i < count; i++) {
          var missile = fire(myName, type, x + shift, y, vy);

          board.add(missile, setup);

          shift += width;
        }
      },
      explode: share.explode,
      addExplosion: FactoryExplosion
    },
    enemy: {
      setup: function(game, enemy, frameRate, set) {
        var t = (typeof enemy.t === 'undefined') ? 0 : enemy.t,
        t = t + frameRate,
        blueprint = enemy.blueprint,
        mySprite = game.spritesheet.map[enemy.myName],
        myWidth = mySprite.w,
        myHeight = mySprite.h,
        params = {
          A: 0,
          B: 0,
          C: 0,
          D: 0,
          E: 0,
          F: 0,
          G: 0,
          H: 0
        },
        out = {
          t: t,
          x: 0,
          y: 0,
          myWidth: myWidth,
          myHeight: myHeight
        };

        set(params, blueprint);

        var vx = params.A + params.B * Math.sin(params.C * t + params.D),
        vy = params.E + params.F * Math.sin(params.G * t + params.H),
        x = (typeof enemy.x === 'undefined') ? blueprint.x : enemy.x,
        x = x + frameRate * vx,
        y = (typeof enemy.y === 'undefined') ? blueprint.y : enemy.y,
        y = y + frameRate * vy;

        out.x = x;

        out.y = y;

        return out;
      },
      set: function(params, list) {
          for(var i in list) {
            params[i] = list[i];
          }
      },
      explode: share.explode,
      addExplosion: FactoryExplosion
    }
  };

  var game = new Game();

  game.setupInput();

  game.setupDrawing(canvas, spritesheet);

  var board = new Gameboard();

  board.add(new Starfield(1, true), setups.starfield);

  board.add(new Player('ship'), setups.ship);

  board.add(new Enemy('enemyPurple', 'enemy', enemies.basic0), setups.enemy);

  board.add(new Enemy('enemyPurple', 'enemy', enemies.basic1), setups.enemy);

  board.add(new Enemy('enemyPurple', 'enemy', enemies.basic2), setups.enemy);

  game.addBoard(board);

  spritesheet.load(sprites, game.loop);

})(document.getElementById('game'));
