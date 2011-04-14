define(['game-engine', 'entity'], function(GameEngine, Entity) {
    GameEngine.assetManager.queueDownload('img/earth.png');
    
    Earth.prototype = new Entity;
    Earth.prototype.constructor = Earth;
    function Earth() {
        Entity.call(this);
        this.sprite = GameEngine.assetManager.getAsset('img/earth.png');
    }
    
    Earth.prototype.draw = function(ctx) {
        Entity.prototype.draw.call(this);
        ctx.drawImage(this.sprite, 0, 0);
    }
    
    return Earth;
});