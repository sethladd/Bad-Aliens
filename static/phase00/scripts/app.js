soundManager.url = 'swf/';
soundManager.flashVersion = 9;
soundManager.debugFlash = false;
soundManager.debugMode = false;

window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              window.oRequestAnimationFrame      ||
              window.msRequestAnimationFrame     ||
              function(/* function */ callback, /* DOMElement */ element){
                window.setTimeout(callback, 1000 / 60);
              };
})();

function AssetManager() {
    this.successCount = 0;
    this.errorCount = 0;
    this.cache = {};
    this.downloadQueue = [];
    this.soundsQueue = [];
}

AssetManager.prototype.queueDownload = function(path) {
    this.downloadQueue.push(path);
}

AssetManager.prototype.queueSound = function(id, path) {
    this.soundsQueue.push({id: id, path: path});
}

AssetManager.prototype.downloadAll = function(downloadCallback) {
    if (this.downloadQueue.length === 0 && this.soundsQueue.length === 0) {
        downloadCallback();
    }
    
    this.downloadSounds(downloadCallback);
    
    for (var i = 0; i < this.downloadQueue.length; i++) {
        var path = this.downloadQueue[i];
        var img = new Image();
        var that = this;
        img.addEventListener("load", function() {
            console.log(this.src + ' is loaded');
            that.successCount += 1;
            if (that.isDone()) {
                downloadCallback();
            }
        }, false);
        img.addEventListener("error", function() {
            that.errorCount += 1;
            if (that.isDone()) {
                downloadCallback();
            }
        }, false);
        img.src = path;
        this.cache[path] = img;
    }
}

AssetManager.prototype.downloadSounds = function(soundsCallback) {
    var that = this;
    soundManager.onready(function() {
        console.log('soundManager ready');
        for (var i = 0; i < that.soundsQueue.length; i++) {
            that.downloadSound(that.soundsQueue[i].id, that.soundsQueue[i].path, soundsCallback);
        }
    });
    soundManager.ontimeout(function() {
        console.log('SM2 did not start');
    });
}

AssetManager.prototype.downloadSound = function(id, path, soundsCallback) {
    var that = this;
    this.cache[path] = soundManager.createSound({
        id: id,
        autoLoad: true,
        url: path,
        onload: function() {
            console.log(this.url + ' is loaded');
            that.successCount += 1;
            if (that.isDone()) {
                soundsCallback();
            }
        }
    });
}

AssetManager.prototype.getSound = function(path) {
    return this.cache[path];
}

AssetManager.prototype.getAsset = function(path) {
    return this.cache[path];
}

AssetManager.prototype.isDone = function() {
    return ((this.downloadQueue.length + this.soundsQueue.length) == this.successCount + this.errorCount);
}

function Animation(spriteSheet, frameWidth, frameDuration, loop) {
    this.spriteSheet = spriteSheet;
    this.frameWidth = frameWidth;
    this.frameDuration = frameDuration;
    this.frameHeight= this.spriteSheet.height;
    this.totalTime = (this.spriteSheet.width / this.frameWidth) * this.frameDuration;
    this.elapsedTime = 0;
    this.loop = loop;
}

Animation.prototype.drawFrame = function(tick, ctx, x, y, scaleBy) {
    var scaleBy = scaleBy || 1;
    this.elapsedTime += tick;
    if (this.loop) {
        if (this.isDone()) {
            this.elapsedTime = 0;
        }
    } else if (this.isDone()) {
        return;
    }
    var index = this.currentFrame();
    var locX = x - (this.frameWidth/2) * scaleBy;
    var locY = y - (this.frameHeight/2) * scaleBy;
    ctx.drawImage(this.spriteSheet,
                  index*this.frameWidth, 0,  // source from sheet
                  this.frameWidth, this.frameHeight,
                  locX, locY,
                  this.frameWidth*scaleBy,
                  this.frameHeight*scaleBy);
}

Animation.prototype.currentFrame = function() {
    return Math.floor(this.elapsedTime / this.frameDuration);
}

Animation.prototype.isDone = function() {
    return (this.elapsedTime >= this.totalTime);
}

function Timer() {
    this.gameTime = 0;
    this.maxStep = 0.05;
    this.wallLastTimestamp = 0;
}

Timer.prototype.tick = function() {
    var wallCurrent = Date.now();
    var wallDelta = (wallCurrent - this.wallLastTimestamp) / 1000;
    this.wallLastTimestamp = wallCurrent;
    
    var gameDelta = Math.min(wallDelta, this.maxStep);
    this.gameTime += gameDelta;
    return gameDelta;
}

function GameEngine() {
    this.entities = [];
    this.ctx = null;
    this.click = null;
    this.mouse = null;
    this.timer = new Timer();
    this.stats = new Stats();
    this.surfaceWidth = null;
    this.surfaceHeight = null;
    this.halfSurfaceWidth = null;
    this.halfSurfaceHeight = null;
}

GameEngine.prototype.init = function(ctx) {
    this.ctx = ctx;
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.halfSurfaceWidth = this.surfaceWidth/2;
    this.halfSurfaceHeight = this.surfaceHeight/2;
    this.startInput();
    document.body.appendChild(this.stats.domElement);
    
    console.log('game initialized');
}

GameEngine.prototype.start = function() {
    console.log("starting game");
    var that = this;
    (function gameLoop() {
        that.loop();
        requestAnimFrame(gameLoop, that.ctx.canvas);
    })();
}

GameEngine.prototype.startInput = function() {
    console.log('Starting input');
    
    var getXandY = function(e) {
        var x =  e.clientX - that.ctx.canvas.getBoundingClientRect().left - (that.ctx.canvas.width/2);
        var y = e.clientY - that.ctx.canvas.getBoundingClientRect().top - (that.ctx.canvas.height/2);
        return {x: x, y: y};
    }
    
    var that = this;
    
    this.ctx.canvas.addEventListener("click", function(e) {
        that.click = getXandY(e);
    }, false);
    
    this.ctx.canvas.addEventListener("mousemove", function(e) {
        that.mouse = getXandY(e);
    }, false);
    
    console.log('Input started');
}

GameEngine.prototype.addEntity = function(entity) {
    this.entities.push(entity);
}

GameEngine.prototype.draw = function(drawCallback) {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.ctx.canvas.width/2, this.ctx.canvas.height/2);
    for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].draw(this.ctx);
    }
    if (drawCallback) {
        drawCallback(this);
    }
    this.ctx.restore();
}

GameEngine.prototype.update = function() {
    var entitiesCount = this.entities.length;
    
    for (var i = 0; i < entitiesCount; i++) {
        var entity = this.entities[i];
        
        if (!entity.removeFromWorld) {
            entity.update();
        }
    }
    
    for (var i = this.entities.length-1; i >= 0; --i) {
        if (this.entities[i].removeFromWorld) {
            this.entities.splice(i, 1);
        }
    }
}

GameEngine.prototype.loop = function() {
    this.clockTick = this.timer.tick();
    this.update();
    this.draw();
    this.click = null;
    this.stats.update();
}

function Entity(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.removeFromWorld = false;
}

Entity.prototype.update = function() {
}

Entity.prototype.draw = function(ctx) {
    if (this.game.showOutlines && this.radius) {
        ctx.beginPath();
        ctx.strokeStyle = "green";
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        ctx.stroke();
        ctx.closePath();
    }
}

Entity.prototype.drawSpriteCentered = function(ctx) {
    var x = this.x - this.sprite.width/2;
    var y = this.y - this.sprite.height/2;
    ctx.drawImage(this.sprite, x, y);
}

Entity.prototype.outsideScreen = function() {
    return (this.x > this.game.halfSurfaceWidth || this.x < -(this.game.halfSurfaceWidth) ||
        this.y > this.game.halfSurfaceHeight || this.y < -(this.game.halfSurfaceHeight));
}

Entity.prototype.rotateAndCache = function(image, angle) {
    var offscreenCanvas = document.createElement('canvas');
    var size = Math.max(image.width, image.height);
    offscreenCanvas.width = size;
    offscreenCanvas.height = size;
    var offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCtx.save();
    offscreenCtx.translate(size/2, size/2);
    offscreenCtx.rotate(angle + Math.PI/2);
    offscreenCtx.translate(0,0);
    offscreenCtx.drawImage(image, -(image.width/2), -(image.height/2));
    offscreenCtx.restore();
    //offscreenCtx.strokeStyle = "red";
    //offscreenCtx.strokeRect(0,0,size,size);
    return offscreenCanvas;
}

function Alien(game, radial_distance, angle) {
    Entity.call(this, game);
    this.radial_distance = radial_distance;
    this.angle = angle;
    this.speed = 100;
    this.sprite = this.rotateAndCache(ASSET_MANAGER.getAsset('img/alien.png'), this.angle);
    this.radius = this.sprite.height/2;
    this.setCoords();
}
Alien.prototype = new Entity();
Alien.prototype.constructor = Alien;

Alien.prototype.setCoords = function() {
    this.x = this.radial_distance * Math.cos(this.angle);
    this.y = this.radial_distance * Math.sin(this.angle);
}

Alien.prototype.update = function() {
    this.setCoords();
    this.radial_distance -= this.speed * this.game.clockTick;

    if (this.hitPlanet()) {
        this.removeFromWorld = true;
        this.game.lives -= 1;
    }
    
    Entity.prototype.update.call(this);
}

Alien.prototype.hitPlanet = function() {
    var distance_squared = ((this.x * this.x) + (this.y * this.y));
    var radii_squared = (this.radius + Earth.RADIUS) * (this.radius + Earth.RADIUS);
    return distance_squared < radii_squared;
}

Alien.prototype.draw = function(ctx) {
    this.drawSpriteCentered(ctx);
    
    Entity.prototype.draw.call(this, ctx);
}

Alien.prototype.explode = function() {
    this.removeFromWorld = true;
    this.game.addEntity(new AlienExplosion(this.game, this.x, this.y));
    ASSET_MANAGER.getSound('audio/alien_boom.mp3').play();
}

function AlienExplosion(game, x, y) {
    Entity.call(this, game, x, y);
    this.animation = new Animation(ASSET_MANAGER.getAsset('img/alien-explosion.png'), 69, 0.05);
    this.radius = this.animation.frameWidth / 2;
}
AlienExplosion.prototype = new Entity();
AlienExplosion.prototype.constructor = AlienExplosion;

AlienExplosion.prototype.update = function() {
    Entity.prototype.update.call(this);
    if (this.animation.isDone()) {
        this.removeFromWorld = true;
    }
}

AlienExplosion.prototype.draw = function(ctx) {
    Entity.prototype.draw.call(this, ctx);
    this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y);
}

function Sentry(game) {
    this.distanceFromEarthCenter = 85;
    Entity.call(this, game, 0, this.distanceFromEarthCenter);
    this.sprite = ASSET_MANAGER.getAsset('img/sentry.png');
    this.radius = this.sprite.width / 2;
    this.angle = 0;
}
Sentry.prototype = new Entity();
Sentry.prototype.constructor = Sentry;

Sentry.prototype.update = function() {
    if (this.game.mouse) {
        this.angle = Math.atan2(this.game.mouse.y, this.game.mouse.x);
        if (this.angle < 0) {
            this.angle += Math.PI * 2;
        }
        this.x = (Math.cos(this.angle) * this.distanceFromEarthCenter);
        this.y = (Math.sin(this.angle) * this.distanceFromEarthCenter);
    }
    if (this.game.click) {
        this.shoot();
    }
    Entity.prototype.update.call(this);
}

Sentry.prototype.draw = function(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + Math.PI/2);
    ctx.drawImage(this.sprite, -this.sprite.width/2, -this.sprite.height/2);
    ctx.restore();
    
    Entity.prototype.draw.call(this, ctx);
}

Sentry.prototype.shoot = function() {
    var bullet = new Bullet(this.game, this.x, this.y, this.angle, this.game.click);
    this.game.addEntity(bullet);
    ASSET_MANAGER.getSound('audio/bullet.mp3').play();
}

function Bullet(game, x, y, angle, explodesAt) {
    Entity.call(this, game, x, y);
    this.angle = angle;
    this.explodesAt = explodesAt;
    this.speed = 250;
    this.radial_distance = 95;
    this.sprite = ASSET_MANAGER.getAsset('img/bullet.png');
    this.animation = new Animation(this.sprite, 7, 0.05, true);
}
Bullet.prototype = new Entity();
Bullet.prototype.constructor = Bullet;

Bullet.prototype.update = function() {
    if (this.outsideScreen()) {
        this.removeFromWorld = true;
    } else if (Math.abs(this.x) >= Math.abs(this.explodesAt.x) || Math.abs(this.y) >= Math.abs(this.explodesAt.y)) {
        ASSET_MANAGER.getSound('audio/bullet_boom.mp3').play();
        this.game.addEntity(new BulletExplosion(this.game, this.explodesAt.x, this.explodesAt.y));
        this.removeFromWorld = true;
    } else {
        this.x = this.radial_distance * Math.cos(this.angle);
        this.y = this.radial_distance * Math.sin(this.angle);
        this.radial_distance += this.speed * this.game.clockTick;
    }
}

Bullet.prototype.draw = function(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + Math.PI/2);
    ctx.translate(-this.x, -this.y);
    this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y);
    ctx.restore();
    
    Entity.prototype.draw.call(this, ctx);
}

function BulletExplosion(game, x, y) {
    Entity.call(this, game, x, y);
    this.sprite = ASSET_MANAGER.getAsset('img/explosion.png');
    this.animation = new Animation(this.sprite, 34, 0.05);
    this.radius = this.animation.frameWidth / 2;
}
BulletExplosion.prototype = new Entity();
BulletExplosion.prototype.constructor = BulletExplosion;

BulletExplosion.prototype.update = function() {
    Entity.prototype.update.call(this);
    
    if (this.animation.isDone()) {
        this.removeFromWorld = true;
        return;
    }
    
    this.radius = (this.animation.frameWidth/2) * this.scaleFactor();
    
    for (var i = 0; i < this.game.entities.length; i++) {
        var alien = this.game.entities[i];
        if (alien instanceof Alien && this.isCaughtInExplosion(alien)) {
            this.game.score += 10;
            alien.explode();
        }
    }
}

BulletExplosion.prototype.isCaughtInExplosion = function(alien) {
    var distance_squared = (((this.x - alien.x) * (this.x - alien.x)) + ((this.y - alien.y) * (this.y - alien.y)));
    var radii_squared = (this.radius + alien.radius) * (this.radius + alien.radius);
    return distance_squared < radii_squared;
}

BulletExplosion.prototype.scaleFactor = function() {
    return 1 + (this.animation.currentFrame() / 3);
}

BulletExplosion.prototype.draw = function(ctx) {
    this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y, this.scaleFactor());
    
    Entity.prototype.draw.call(this, ctx);
}

function Earth(game) {
    Entity.call(this, game, 0, 0);
    this.sprite = ASSET_MANAGER.getAsset('img/earth.png');
}
Earth.prototype = new Entity();
Earth.prototype.constructor = Earth;

Earth.RADIUS = 67;

Earth.prototype.draw = function(ctx) {
    ctx.drawImage(this.sprite, this.x - this.sprite.width/2, this.y - this.sprite.height/2);
}

function EvilAliens() {
    GameEngine.call(this);
    //this.showOutlines = true;
    this.lives = 10;
    this.score = 0;
}
EvilAliens.prototype = new GameEngine();
EvilAliens.prototype.constructor = EvilAliens;

EvilAliens.prototype.start = function() {
    this.sentry = new Sentry(this);
    this.earth = new Earth(this);
    this.addEntity(this.earth);
    this.addEntity(this.sentry);
    GameEngine.prototype.start.call(this);
}

EvilAliens.prototype.update = function() {
    if (this.lastAlienAddedAt == null || (this.timer.gameTime - this.lastAlienAddedAt) > 1) {
        this.addEntity(new Alien(this, this.ctx.canvas.width, Math.random() * Math.PI * 180));
        this.lastAlienAddedAt = this.timer.gameTime;
    }
    
    if (this.score <= 0) {
        // show game over screen
    }
    
    GameEngine.prototype.update.call(this);
}

EvilAliens.prototype.draw = function() {
    GameEngine.prototype.draw.call(this, function(game) {
        game.drawScore();
        game.drawLives();
    });
}

EvilAliens.prototype.drawLives = function() {
    this.ctx.fillStyle = "red";
    this.ctx.font = "bold 2em Arial";
    this.ctx.fillText("Lives: " + this.lives, -this.ctx.canvas.width/2 + 50, this.ctx.canvas.height/2 - 80);
}

EvilAliens.prototype.drawScore = function() {
    this.ctx.fillStyle = "red";
    this.ctx.font = "bold 2em Arial";
    this.ctx.fillText("Score: " + this.score, -this.ctx.canvas.width/2 + 50, this.ctx.canvas.height/2 - 50);
}

var canvas = document.getElementById('surface');
var ctx = canvas.getContext('2d');
var game = new EvilAliens();
var ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload('img/alien-explosion.png');
ASSET_MANAGER.queueDownload('img/alien.png');
ASSET_MANAGER.queueDownload('img/bullet.png');
ASSET_MANAGER.queueDownload('img/earth.png');
ASSET_MANAGER.queueDownload('img/sentry.png');
ASSET_MANAGER.queueDownload('img/explosion.png');
ASSET_MANAGER.queueSound('alien-boom', 'audio/alien_boom.mp3');
ASSET_MANAGER.queueSound('bullet-boom', 'audio/bullet_boom.mp3');
ASSET_MANAGER.queueSound('bullet', 'audio/bullet.mp3');

ASSET_MANAGER.downloadAll(function() {
    game.init(ctx);
    game.start();
});