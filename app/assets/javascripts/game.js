(function(canvas) {
  var ctx = canvas.getContext && canvas.getContext('2d');

  // game title
  var Titlescreen = function(_title, _subtitle, _callback, _game) {
    var root = this;

    var up = false;

    // do things in a step
    root.step = function(_frameRate) {
      if(!_game.keys['fire']) up = true;
      if(up && _game.keys['fire'] && _callback) _callback();
    };

    root.draw = function(_ctx) {
      _ctx.fillStyle = '#ffffff';

      _ctx.textAlign = 'center';

      _ctx.font = 'bold 40px arial';

      _ctx.fillText(_title, _game.width / 2, _game.hight / 2);

      _ctx.font = 'bold 20px arial';

      _ctx.fillText(_subtitle, _game.width / 2, (_game.height / 2) + 40);
    };
  };

  // scrolling background
  var Starfield = function(_speed, _opacity, _numStars, _clear, _game) {
    var root = this;
    // draw off screen first
    var stars = document.createElement('canvas');

    stars.width = _game.width;

    stars.height = _game.height;

    var starsCtx = stars.getContext('2d');

    var offset = 0;

    // if the _clear option is set
    // make the background black instead of transparent
    if(_clear) {
      starsCtx.fillStyle = '#000';

      starsCtx.fillRect(0, 0, stars.width, stars.height);
    }

    // draw a bunch of random 2px rectangles on the background`
    // make it on random position
    starsCtx.fillStyle = '#fff';

    starsCtx.globalAlpha = _opacity;

    for(var i = 0; i < _numStars; i++) {
      starsCtx.fillRect(
        Math.random() * stars.width,
        Math.random() * stars.height,
        2,
        2
      );
    }

    // this is called every frame
    // to draw starfield on to the canvas
    root.draw = function(_ctx) {
      var intOffset = Math.floor(offset);

      var remaining = stars.height - intOffset;

      // draw the top half of the starfield
      if(intOffset > 0) {
        _ctx.drawImage(stars, 0, remaining, stars.width, intOffset, 0, 0, stars.width, intOffset);
      }

      if(remaining > 0){
        ctx.drawImage(stars, 0, 0, stars.width, remaining, 0, intOffset, stars.width, remaining);
      }
    };

    // update starfield
    root.step = function(frameRate) {
      offset += frameRate * _speed;
      offset = offset % stars.height;
    };
  };

  // used for drawing sprites
  var Sprite = function(_spritesheet) {
    var root = this;

    root.spritesheet = _spritesheet;

    root.setup = function(_sprite, _props) {
      root.sprite = _sprite;

      root.merge(_props);

      root.frame = root.frame || 0;

      root.w = root.spritesheet.map[_sprite].w;

      root.h = root.spritesheet.map[_sprite].h;
    };

    root.merge = function(_props) {
      if(_props) {
        for(var prop in _props) {
          root[prop] = _props[prop];
        }
      }
    };

    root.draw = function(_ctx) {
      _spritesheet.draw(_ctx, root.x, root.y, root.frame);
    };
  };

  var Player = function(_spritesheet, _game, _missileCall) {
    var root = this;

    root.setup('ship', {vx: 0, reloadTime: 0.25, maxVel: 200});

    root.reload = root.reloadTime;

    root.x = _game.width / 2 - root.w / 2;

    root.y = _game.height - 10 - root.h;

    root.step = function(_frameRate) {
      if(_game.keys['left']) root.vx = -root.maxVel;
      else if(_game.keys['right']) root.vx = root.maxVel;
      else root.vx = 0;

      root.x += root.vx * _frameRate;

      if(root.x < 0) root.x = 0;
      else if(root.x > _game.width - root.w) root.x = _game.width - root.w;

      root.reload -= _frameRate;

      if(_game.keys['fire'] && root.reload < 0) {
        _game.keys['fire'] = false;

        root.reload = root.reloadTime;

        // todo, move somewhere
        // not player's concern
        root.board.add(_missileCall(root.x, root.y + root.h / 2, _spritesheet));
        root.board.add(_missileCall(root.x + root.w, root.y + root.h / 2, _spritesheet));
      }
    };
  };

  Player.prototype = new Sprite(spritesheet);

  // shooting, player uses it
  var PlayerMissile = function(_x, _y, _spritesheet) {
    var root = this;

    root.setup('missile', {vy: -700});

    root.x = x + root.w / 2;

    root.y = y + root.h;

    root.step = function(_frameRate) {
      root.y += root.vy * _frameRate;

      if(root.y < -root.h) root.board.remove(root);
    };
  };

  PlayerMissile.prototype = new Sprite(spritesheet);

  // enemy
  var Enemy = function(_blueprint, _override, _game, _spritesheet) {
    var root = this;

    var baseParameters = {A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0};

    // in parallel
    root.merge(root.baseParameters);
    root.setup(_blueprint.sprite, _blueprint);
    root.merge(_override);

    root.step = function(_frameRate) {
      root.t += _frameRate;

      root.vx = root.A + root.B * Math.sin(root.C * root.t + root.D);

      root.vy = root.E + root.F * Math.sin(root.G * root.t + root.H);

      root.x += root.vx * _frameRate;

      root.y += root.vy * _frameRate;

      if(root.y > _game.height || root.x < -root.w || root.x > _game.width) root.board.remove(root);
    };
  };

  Enemy.prototype = new Sprite(spritesheet);

  // game board
  // handles sprites
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

    // find, first object for which fyunc is true
    root.detect = function(func) {
      for(var i = 0, val = null, len = root.objects.length; i < len; i++) {
        // truth search, speed, somehow
        // heur, struct that matches heur
        if(func.call(root.objects[i])) return root.objects[i];
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
    root.draw = function(_ctx) {
      root.iterate('draw', _ctx);
    };

    // collision, check it between two things
    root.overlap = function(thing1, thing2) {
      return !((thing1.y + thing1.h - 1 < thing2.y) || (thing1.y > thing2.y + thing2.h - 1) || (thing1.x + thing1.w -1 < thing2.x) || (thing1.x > thing2.x + thing2.w - 1));
    };

    // collide, get first that collides with object
    root.collide = function(thing, type) {
      return root.detect(function() {
        if(thing != this) {
          var collision = (!type || this.type & type) && board.overlap(thing, this);

          return col ? this : false;
        }
      });
    };
  };

  // can have only one spritesheet
  var spritesheet = new function() {
    var root = this;

    root.map = {};

    root.load = function(_spriteData, _callback) {
      root.map = _spriteData;

      root.image = new Image();

      root.image.onload = _callback;

      root.image.src = '/assets/sprites.png';
    };

    root.draw = function(_ctx, _sprite, _x, _y, _frame) {
      var s = root.map[_sprite];

      if(!_frame) _frame = 0;

      _ctx.drawImage(root.image, s.sx + _frame * s.w, s.sy, s.w, s.h, Math.floor(_x), Math.floor(_y), s.w, s.h);
    };
  };

  // running the game, can have only one
  var game = new function() {
    var root = this;

    // set up the game
    root.initialize = function(_canvasElementId, _spritesheet, _spriteData, _callback) {
      root.canvas = document.getElementById(_canvasElementId);

      root.width = root.canvas.width;

      root.height = root.canvas.height;

      root.ctx = root.canvas.getContext && root.canvas.getContext('2d');

      if(!root.ctx) console.log('no context');

      root.setupInput();

      root.loop();

      _spritesheet.load(_spriteData, _callback);
    };

    var KEY_CODES = {37: 'left', 39: 'right', 32: 'fire'};

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

    // game loop
    var boards = [];

    root.loop = function () {
      var frames = 30;

      var frameRate = frames / 1000;

      for(var i=0, len = boards.length; i < len; i++) {
        if(boards[i]) {
          boards[i].step(frameRate);

          boards[i].draw(root.ctx);
        }
      }

      setTimeout(root.loop, frames);
    };

    root.setBoard = function(num, board) {
      boards[num] = board;
    };
  };

  var sprites = {
    ship: {sx: 0, sy: 0, w: 37, h: 42, frames: 1},
    missile: {sx: 0, sy: 30, w: 2, h: 10, frames: 1},
    enemyPurple: {sx: 37, sy: 0, w: 42, h: 43, frames: 1},
    enemyBee: {sx: 79, sy: 0, w: 37, h: 43, frames: 1},
    enemyShip: {sx: 116, sy: 0, w: 42, h: 43, frames:1},
    enemyCircle: {sx: 158, sy: 0, w: 32, h: 33, frames:1}
  };

  // behaviour of enemies
  var enemies = {
    basic: {x: 100, y: -50, sprite: 'enemyPurple', B: 100, C: 2, E: 100}
  };

  var playGame = function() {
    // board with units
    var board = new Gameboard();

    // adds missiles
    var missileCall = function(_x, _y, _spritesheet) {
      return new PlayerMissile(_x, _y, _spritesheet);
    };

    board.add(new Enemy(enemies.basic, {}, game, spritesheet));
    board.add(new Enemy(enemies.basic, {x: 200}, game, spritesheet));
    board.add(new Player(spritesheet, game, missileCall));

    game.setBoard(3, board);
  };

  var startGame = function() {
    game.setBoard(0, new Starfield(20, 0.4, 100, true, game));
    game.setBoard(1, new Starfield(50, 0.6, 100, false, game));
    game.setBoard(2, new Starfield(100, 1.0, 50, false, game));
    game.setBoard(3, new Titlescreen('Blaster', 'blast them aliens', playGame, game));
  };

  game.initialize('game', spritesheet, sprites, startGame);

})(document.getElementById('game'));
