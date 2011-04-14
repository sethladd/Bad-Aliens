require(['game-engine', 'alien'], function(GameEngine) {
    var canvas = document.getElementById('surface');
    var ctx = canvas.getContext('2d');
    GameEngine.init(ctx, function() {
        GameEngine.start();
    });
});