/**
 *  handle boot screen
 *
 */


define([], function(){

    //boot場景，用來做一些遊戲啟動前的準備
    var boot = function(game){
        var func = function() {
            this.preload = function(){
                game.load.image('loading','StartView.png'); //載入進度條圖片資源
            };

            this.create = function(){
                var keyEnter = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
                keyEnter.onDown.add(pressEnter, this);

                var bg = game.add.tileSprite(0,0,game.width,game.height,'loading'); //當作背景的tileSprite

                var pressEnterArea = game.add.text(440, 700,
                                          "PRESS ENTER TO CONTINUE",
                                          { font: "40px Arial",
                                            fill: "#FFFFFF",
                                            wordWrap: false,
                                            align: "center",
                                            backgroundColor: 'rgba(0,0,0,0.0)'
                                          });
                pressEnterArea.alpha = 0.1;

                //to(properties, duration, ease, autoStart, delay, repeat, yoyo)
                game.add.tween(pressEnterArea).to( {alpha: 1}, 1500, "Linear", true, 1000, 20000, true).loop(true);
            };

            function pressEnter() {
                game.state.start('battle');
            }
        }

        return func;
    };

    return {
        boot: boot,
    };
});
