require(['game-engine', 'alien', 'earth'], function(GameEngine, Alien, Earth) {
    var canvas = document.getElementById('surface');
    var ctx = canvas.getContext('2d');
    GameEngine.init(ctx, function() {
        GameEngine.addEntity(new Earth());
        GameEngine.start();
    });
});