define(function() {
    function Timer() {
        this.gameTime = 0;
        this.lastTick = 0;
        this.maxStep = 0.05;
        this.lastTimestamp = 0;
    }

    Timer.prototype.step = function() {
        var current = Date.now();
        var delta = (current - this.lastTimestamp) / 1000;
        this.gameTime += Math.min(delta, this.maxStep);
        this.lastTimestamp = current;
    }

    Timer.prototype.tickDiff = function() {
        var delta = this.gameTime - this.lastTick;
        this.lastTick = this.gameTime;
        return delta;
    }
    
    return Timer;
});