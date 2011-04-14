define(['game-engine', 'entity'], function(GameEngine, Entity) {
    Alien.prototype = new Entity;
    Alien.prototype.constructor = Alien;
    function Alien(x,y) {
        Entity.call(this);
        
    }
    
    Alien.prototype.update = function() {
        Entity.prototype.update.call(this);
        this.x += 1;
    }
    
    Alien.prototype.draw = function(ctx) {
        Entity.prototype.draw.call(this);
    }
});