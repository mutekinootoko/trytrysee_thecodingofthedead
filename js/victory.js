/**
 *  victory screen
 *
 */

/**
 *  victory screen
 *
 */

define([""], function(){

    var victoryStage = function(game, bluemixDiv){
        var func = function() {


            this.preload = function(){
            };

            this.create = function(){
                bluemixDiv.show();

                game.physics.startSystem(Phaser.Physics.ARCADE);
                game.add.tileSprite(0, 0, 800, 600, 'winBg');

                // world邊界設定的比camera大一點，可以做搖晃效果
                game.world.setBounds(0, 0, game.world.width + 15, game.world.height);
            };

            return this;
        }; // var func

        return func;
    }; //var battle

    return {
        victory: victoryStage,
    };
});


