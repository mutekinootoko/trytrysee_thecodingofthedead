/**
 *  game over screen
 *
 */

define([""], function(){

    var overStage = function(game){
        var func = function() {

            var TypingEnum = {"off":0, "dialog":1, "answer":2}
            this.preload = function(){
            };

            this.create = function(){

                game.physics.startSystem(Phaser.Physics.ARCADE);
                game.add.tileSprite(0, 0, 800, 600, 'gameOver');

                // world邊界設定的比camera大一點，可以做搖晃效果
                game.world.setBounds(0, 0, game.world.width + 15, game.world.height);
                game.input.keyboard.onDownCallback = function(e) {
                    var stateName = game.States.mLastState;
                    if (stateName)
                    {
                        var state = game.States[stateName]();
                        game.state.add(stateName, state);
                        game.state.start(stateName);
                    }
                }
            };
            this.shutdown = function(){

                // remove keyboard bindings
                 game.input.keyboard.onDownCallback = null;
                //game.input.keyboard.clearCaptures();
            }

            return this;
        }; // var func

        return func;
    }; //var battle

    return {
        lose: overStage,
    };
});



