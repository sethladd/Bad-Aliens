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
    this.timer = new Timer();
    this.stats = new Stats();
}

GameEngine.prototype.init = function(ctx, callback) {
    console.log('game initialized');
    this.ctx = ctx;
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
        var x =  event.clientX - that.ctx.canvas.getBoundingClientRect().left - (that.ctx.canvas.width/2);
        var y = event.clientY - that.ctx.canvas.getBoundingClientRect().top - (that.ctx.canvas.height/2);
        that.click = {x:x, y:y};
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
    for (var i = 0; i < this.entities.length; i++) {
        this.entities[i].update();
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
    ctx.drawImage(this.sprite, this.x, this.y);
}

Entity.prototype.drawCentered = function(ctx) {
    ctx.save();
    ctx.translate(-this.sprite.width/2, -this.sprite.height/2);
    ctx.drawImage(this.sprite, this.x, this.y);
    ctx.restore();
}

function Sentry(game) {
    Entity.call(this, game, 0, -Earth.RADIUS + 50);
    this.sprite = assetManager.getAsset('img/sentry.png');
    this.radius = this.sprite.width / 2;
    this.radial_distance = this.y;
    this.angle = 0;
    this.speed = 4;
    this.rotationAngle = 0;
}
Sentry.prototype = new Entity();
Sentry.prototype.constructor = Sentry;

Sentry.prototype.update = function() {
    this.x = this.radial_distance * Math.cos(this.angle);
    this.y = this.radial_distance * Math.sin(this.angle);
    this.angle += this.speed * this.game.clockTick;
    if (this.angle > 6.28318531) this.angle = 0;
    Entity.prototype.update.call(this);
}

Sentry.prototype.draw = function(ctx) {
    this.drawCentered(ctx);
}

function Earth(game) {
    Entity.call(this, game, 0, 0);
    this.sprite = assetManager.getAsset('img/earth.png');
}
Earth.prototype = new Entity();
Earth.prototype.constructor = Earth;

Earth.RADIUS = 134;

Earth.prototype.draw = function(ctx) {
    this.drawCentered(ctx);
}


function Alien(game, x, y) {
    Entity.call(this, game, x, y);
    this.sprite = this.game.getAsset('img/alien.png');
    this.radial_distance = radial_distance;
    this.speed = 100;
    this.angle = angle;
}
Alien.prototype = new Entity();
Alien.prototype.constructor = Alien;

Alien.prototype.update = function() {
    Entity.prototype.update.call(this);
    
    this.x = this.radial_distance * Math.cos(this.angle);
    this.y = this.radial_distance * Math.sin(this.angle);
    this.radial_distance -= this.speed * GameEngine.clockTick;

    if (this.hitPlanet()) {
        this.remove = true;
    }
}

Alien.prototype.hitPlanet = function() {
    var distance_squared = ((this.x * this.x) + (this.y * this.y));
    var radii_squared = (this.radius + Earth.RADIUS) * (this.radius + Earth.RADIUS);
    return distance_squared < radii_squared;
}

function EvilAliens() {
    GameEngine.call(this);
}
EvilAliens.prototype = new GameEngine();
EvilAliens.prototype.constructor = EvilAliens;

EvilAliens.prototype.start = function() {
    this.addEntity(new Earth(this));
    this.addEntity(new Sentry(this));
    GameEngine.prototype.start.call(this);
}

EvilAliens.prototype.update = function() {
    if (this.click) {
        
    }
    
    GameEngine.prototype.update.call(this);
}

var canvas = document.getElementById('surface');
var ctx = canvas.getContext('2d');
var game = new EvilAliens();
var assetManager = new AssetManager();

assetManager.queueDownload('img/earth.png');
assetManager.queueDownload('img/sentry.png');

assetManager.downloadAll(function() {
    game.init(ctx);
    game.start();
});