define(function() {
    function Timer() {
        this.gameTime = 0;
        this.maxStep = 0.05;
        this.wallLastTimestamp = 0;
    }

    Timer.prototype.tick = function() {
        var wallCurrent = Date.now();
        var wallDelta = (wallCurrent - this.lastTimestamp) / 1000;
        this.wallLastTimestamp = wallCurrent;
        
        var gameDelta = Math.min(wallDelta, this.maxStep);
        this.gameTime += gameDelta;
        return gameDelta;
    }
    
    return Timer;
});