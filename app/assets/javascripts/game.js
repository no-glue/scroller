(function(canvas) {
  var Player = function(_spritesheet, _game) {
    var root = this;

    root.w = _spritesheet.map['ship'].w;

    root.h = spritesheet.map['ship'].h;

    root.x = _game.width / 2 - root.w / 2;

    root.y = _game.height - 10 - root.h;

    root.vx = 0;

    // quarter second
    root.reloadTime = 0.25;

    root.reload = root.reloadTime;

    root.maxVel = 200;

    root.step = function(_frameRate) {
      if(_game.keys['left']) {root.x -= root.maxVel * _frameRate}
      else if(_game.keys['right']) {root.x += root.maxVel * _frameRate;}
      else {this.vx = 0;}

      if(root.x < 0){
        root.x = 0;
      } else if(root.x > _game.width - root.w){
        root.x = _game.width - root.w;
      }

      root.reload -= _frameRate;
    }

    root.draw = function(_ctx) {
      _spritesheet.draw(_ctx, 'ship', root.x, root.y);
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
    root.draw = function(_ctx, _spritesheet) {
      root.iterate('draw', _ctx, _spritesheet);
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

  // running the game, should have only one
  // todo, somehow make only one
  var Game = function() {
    var root = this;

    // game loop
    var boards = [];

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

    root.setupDrawing = function(canvasElementId) {
      root.canvas = document.getElementById(canvasElementId);

      root.width = root.canvas.width;

      root.height = root.canvas.height;

      root.ctx = root.canvas.getContext('2d');
    };

    // game loop
    // everything happens here
    root.loop = function () {
      var frames = 30;

      var frameRate = frames / 1000;

      for(var i=0, len = boards.length; i < len; i++) {
        if(boards[i]) {
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

  game.setupDrawing('game');

  spritesheet.load(sprites, game.loop);

})(document.getElementById('game'));
