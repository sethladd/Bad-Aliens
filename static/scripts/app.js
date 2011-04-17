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
}

AssetManager.prototype.queueDownload = function(path) {
    this.downloadQueue.push(path);
}

AssetManager.prototype.downloadAll = function(callback) {
    if (this.downloadQueue.length == 0) {
        callback();
    }
    for (var i = 0; i < this.downloadQueue.length; i++) {
        var path = this.downloadQueue[i];
        var img = new Image();
        var that = this;
        img.addEventListener("load", function() {
            that.successCount += 1;
            if (that.isDone()) {
                callback();
            }
        });
        img.addEventListener("error", function() {
            that.errorCount += 1;
            if (that.isDone()) {
                callback();
            }
        });
        img.src = path;
        this.cache[path] = img;
    }
}

AssetManager.prototype.getAsset = function(path) {
    return this.cache[path];
}

AssetManager.prototype.isDone = function() {
    return (this.downloadQueue.length == this.successCount + this.errorCount);
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

GameEngine.prototype.init = function(ctx, callback) {
    console.log('game initialized');
    this.ctx = ctx;
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.halfSurfaceWidth = this.surfaceWidth/2;
    this.halfSurfaceHeight = this.surfaceHeight/2;
    this.startInput();
    document.body.appendChild(this.stats.domElement);
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
    var that = this;
    this.ctx.canvas.addEventListener("click", function(e) {
        var x =  e.clientX - that.ctx.canvas.getBoundingClientRect().left - (that.ctx.canvas.width/2);
        var y = e.clientY - that.ctx.canvas.getBoundingClientRect().top - (that.ctx.canvas.height/2);
        that.click = {x:x, y:y};
    });
    this.ctx.canvas.addEventListener("mousemove", function(e) {
        var x =  e.clientX - that.ctx.canvas.getBoundingClientRect().left - (that.ctx.canvas.width/2);
        var y = e.clientY - that.ctx.canvas.getBoundingClientRect().top - (that.ctx.canvas.height/2);
        that.mouse = {x:x, y:y};
    });
}

GameEngine.prototype.addEntity = function(entity) {
    this.entities.push(entity);
}

GameEngine.prototype.draw = function() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.save();
    this.ctx.translate(this.ctx.canvas.width/2, this.ctx.canvas.height/2);
    for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].draw(this.ctx);
    }
    this.ctx.restore();
}

GameEngine.prototype.update = function() {
    var dead = [];
    
    for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].update();
        if (this.entities[i].removeFromWorld) {
            dead.push(i);
        }
    }
    
    for (var i = 0; i < dead.length; i++) {
        this.entities.splice(dead[i], 1);
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
}

function Alien(game, radial_distance, angle) {
    console.log("alien added");
    Entity.call(this, game);
    this.radial_distance = radial_distance;
    this.angle = angle;
    this.speed = 100;
    this.sprite = assetManager.getAsset('img/alien.png');
    this.radius = this.sprite.height;
}
Alien.prototype = new Entity();
Alien.prototype.constructor = Alien;

Alien.prototype.update = function() {
    this.x = this.radial_distance * Math.cos(this.angle);
    this.y = this.radial_distance * Math.sin(this.angle);
    this.radial_distance -= this.speed * this.game.clockTick;

    if (this.hitPlanet()) {
        this.removeFromWorld = true;
    }
    Entity.prototype.update.call(this);
}

Alien.prototype.hitPlanet = function() {
    var distance_squared = ((this.x * this.x) + (this.y * this.y));
    var radii_squared = (this.radius + Earth.RADIUS) * (this.radius + Earth.RADIUS);
    return distance_squared < radii_squared;
}

Alien.prototype.draw = function(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + Math.PI/2);
    ctx.translate(-this.x, -this.y);
    ctx.drawImage(this.sprite, this.x, this.y);
    ctx.restore();
}

function Sentry(game) {
    this.distanceFromEarthCenter = 85;
    Entity.call(this, game, 0, this.distanceFromEarthCenter);
    this.sprite = assetManager.getAsset('img/sentry.png');
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
    ctx.translate(-(this.x), -(this.y));
    ctx.drawImage(this.sprite, this.x - this.sprite.width/2, this.y - this.sprite.height/2);
    ctx.restore();
}

Sentry.prototype.shoot = function() {
    var bullet = new Bullet(this.game, this.x, this.y, this.angle, this.game.click);
    this.game.addEntity(bullet);
}

function Bullet(game, x, y, angle, explodesAt) {
    Entity.call(this, game, x, y);
    this.angle = angle;
    this.explodesAt = explodesAt;
    this.speed = 100;
    this.radial_distance = 95;
    this.sprite = assetManager.getAsset('img/bullet.png');
    this.animation = new Animation(this.sprite, 7, 0.05, true);
}
Bullet.prototype = new Entity();
Bullet.prototype.constructor = Bullet;

Bullet.prototype.update = function() {
    if (this.x > this.game.halfSurfaceWidth || this.x < -(this.game.halfSurfaceWidth) ||
        this.y > this.game.halfSurfaceHeight || this.y < -(this.game.halfSurfaceHeight)) {
            this.removeFromWorld = true;
    } else if (Math.abs(this.x) >= Math.abs(this.explodesAt.x) || Math.abs(this.y) >= Math.abs(this.explodesAt.y)) {
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
}

function BulletExplosion(game, x, y) {
	Entity.call(this, game, x, y);
	this.sprite = assetManager.getAsset('img/explosion.png');
	this.animation = new Animation(this.sprite, 34, 0.05);
}
BulletExplosion.prototype = new Entity();
BulletExplosion.prototype.constructor = BulletExplosion;

BulletExplosion.prototype.update = function() {
	Entity.prototype.update.call(this);
	if (this.animation.isDone()) {
		this.removeFromWorld = true;
	}
}

BulletExplosion.prototype.draw = function(ctx) {
	this.animation.drawFrame(this.game.clockTick, ctx, this.x, this.y,
	    1+(this.animation.currentFrame()/3));
}

function Earth(game) {
    Entity.call(this, game, 0, 0);
    this.sprite = assetManager.getAsset('img/earth.png');
}
Earth.prototype = new Entity();
Earth.prototype.constructor = Earth;

Earth.RADIUS = 67;

Earth.prototype.draw = function(ctx) {
    ctx.drawImage(this.sprite, this.x - this.sprite.width/2, this.y - this.sprite.height/2);
}

function EvilAliens() {
    GameEngine.call(this);
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
    // if (this.click) {
    //     var angle = Math.atan2(this.click.y, this.click.x);
    //     if (angle < 0) {
    //         angle += Math.PI * 2;
    //     }
    //     this.sentry.reorient(angle);
    // }
    
    if (this.lastAlienAddedAt == null || (this.timer.gameTime - this.lastAlienAddedAt) > 20) {
        this.addEntity(new Alien(this, this.ctx.canvas.width, Math.random() * Math.PI * 180));
        this.lastAlienAddedAt = this.timer.gameTime;
    }
    
    GameEngine.prototype.update.call(this);
}

var canvas = document.getElementById('surface');
var ctx = canvas.getContext('2d');
var game = new EvilAliens();
var assetManager = new AssetManager();

assetManager.queueDownload('img/alien.png');
assetManager.queueDownload('img/bullet.png');
assetManager.queueDownload('img/earth.png');
assetManager.queueDownload('img/sentry.png');
assetManager.queueDownload('img/explosion.png');

assetManager.downloadAll(function() {
    game.init(ctx);
    game.start();
});