/**
 *  handle boot screen
 *
 */


define([], function(){

    //boot場景，用來做一些遊戲啟動前的準備
    var boot = function(game){
        var func = function() {

            var pressEnterArea;
            this.preload = function(){
                game.load.image('loading','assets/StartView.jpg'); //載入進度條圖片資源
            };

            this.create = function(){
                game.load.onLoadComplete.add(loadComplete, this);
                game.load.onFileComplete.add(fileComplete, this);

                var bg = game.add.tileSprite(0,0,game.width,game.height,'loading'); //當作背景的tileSprite

                pressEnterArea = game.add.text(game.width*0.5, game.height - 100.0,
                                          "Loading...      ",
                                          { font: "40px Arial",
                                            fill: "#FFFFFF",
                                            wordWrap: false,
                                            align: "center",
                                            backgroundColor: 'rgba(0,0,0,0.0)'
                                          });
                pressEnterArea.anchor.set(0.5);
                pressEnterArea.alpha = 0.1;

                //to(properties, duration, ease, autoStart, delay, repeat, yoyo)
                game.add.tween(pressEnterArea).to( {alpha: 1}, 1500, "Linear", true, 500, 20000, true).loop(true);

                // preload other stages' resources
                start();

            };

            function start() {
                game.load.image('gameBg', 'assets/gameBg.jpg');
                game.load.image('tutorialBg', 'assets/tutorialBg.jpg');
                game.load.image('bossBg', 'assets/bossBg.jpg');
                game.load.audio('bgmusic', ['assets/audio/backgroundMusic.mp3', 'assets/audio/backgroundMusic.ogg']);
                game.load.audio('zombieGrr1', ['assets/audio/zombie-1.mp3', 'assets/audio/zombie-1.ogg']);
                game.load.audio('zombieGrr4', ['assets/audio/zombie-4.mp3', 'assets/audio/zombie-4.ogg']);
                game.load.audio('zombieGrr10', ['assets/audio/zombie-10.mp3', 'assets/audio/zombie-10.ogg']);
                game.load.audio('zombieGrr11', ['assets/audio/zombie-11.mp3', 'assets/audio/zombie-11.ogg']);
                game.load.audio('zombieGrr15', ['assets/audio/zombie-15.mp3', 'assets/audio/zombie-15.ogg']);
                game.load.audio('earthquake', ['assets/audio/earthquake.mp3', 'assets/audio/earthquake.ogg']);
                game.load.audio('explosion', ['assets/audio/explosion.mp3', 'assets/audio/explosion.ogg']);

                // gun shot
                game.load.audio('gunshot', ['assets/audio/gunshot2.mp3', 'assets/audio/gunshot2.ogg']);

                // battle resrouces
                game.load.spritesheet('zombieGo', 'assets/zombieGo.png', 200, 312, 10);
                game.load.spritesheet('zombieIdle', 'assets/zombieIdle.png', 200, 308, 6);
                game.load.spritesheet('zombieHit', 'assets/zombieHit.png', 372, 324, 7);
                game.load.spritesheet('zombieDie', 'assets/zombieDie.png', 444, 292, 8);

                // tutorial resources
                game.load.spritesheet('zombieAppear', 'assets/zombieAppear.png', 220, 288, 11);
                game.load.spritesheet('zombieHide', 'assets/zombieHide.png', 220, 288, 11);

                // boss resources
                game.load.spritesheet('bossIdle', 'assets/bossSpriteSheet/bossIdle.png', 460, 352, 6);
                game.load.spritesheet('bossAttack', 'assets/bossSpriteSheet/bossAttack.png', 528, 372, 6);
                game.load.spritesheet('bossDie', 'assets/bossSpriteSheet/bossDie.png', 456, 504, 7);

                game.load.image('winBg', 'assets/winBg.jpg');
                game.load.image('gameOver', 'assets/GameOver.jpg');

                game.load.start();
            }

            this.shutdown = function(){

                // remove keyboard bindings
                 game.input.keyboard.onDownCallback = null;
                //game.input.keyboard.clearCaptures();
            }

            //	This callback is sent the following parameters:
            function fileComplete(progress, cacheKey, success, totalLoaded, totalFiles) {
                pressEnterArea.text = "Loading...   " + progress + "%";
            }

            function loadComplete() {
                pressEnterArea.text = "PRESS ANY KEY TO CONTINUE";

                game.input.keyboard.onDownCallback = function(e) {
                    pressEnter();
                }
            }

            function pressEnter() {
                game.state.start('tutorial');
                //game.state.start('battle');
                //game.state.start('boss');
            }
        }

        return func;
    };

    return {
        boot: boot,
    };
});
