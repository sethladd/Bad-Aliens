define(['asset-manager'], function(AssetManager) {
    function GameEngine() {
        
    };
    
    GameEngine.prototype.init = function() {
        console.log('game initialized');
    };
    
    return GameEngine;
});