define(['asset-manager', 'timer'], function(AssetManager, Timer) {
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
        callback();
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
    
    GameEngine.prototype.draw = function() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.save();
        this.ctx.translate(this.ctx.canvas.width/2, this.ctx.canvas.height/2);
        for (var i = 0; i < this.entities.length; i++) {
            this.entities[i].draw();
        }
        this.ctx.restore();
    }
    
    GameEngine.prototype.update = function() {
        for (var i = 0; i < this.entities.length; i++) {
            this.entities[i].update();
        }
    }

    GameEngine.prototype.loop = function() {
        this.timer.step();
        this.clockTick = this.timer.tickDiff();
        this.update();
        this.draw();
        this.click = null;
        this.stats.update();
    }
    
    var gameEngine = new GameEngine();
    
    return gameEngine;
});