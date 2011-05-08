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
    if (this.downloadQueue.length === 0 && this.soundsQueue.length === 0) {
        callback();
    }
    
    for (var i = 0; i < this.downloadQueue.length; i++) {
        var path = this.downloadQueue[i];
        var img = new Image();
        var that = this;
        img.addEventListener("load", function() {
            console.log(this.src + ' is loaded');
            that.successCount += 1;
            if (that.isDone()) {
                callback();
            }
        }, false);
        img.addEventListener("error", function() {
            that.errorCount += 1;
            if (that.isDone()) {
                callback();
            }
        }, false);
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

var canvas = document.getElementById('surface');
var ctx = canvas.getContext('2d');
var ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload('img/earth.png');

ASSET_MANAGER.downloadAll(function() {
    var x = 0, y = 0;
    var sprite = ASSET_MANAGER.getAsset('img/earth.png');
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.drawImage(sprite, x - sprite.width/2, y - sprite.height/2);
    ctx.restore();
});