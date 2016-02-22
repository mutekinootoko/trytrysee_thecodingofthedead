/**
 *  handle in game tutorial
 *
 *  1. bob shows up from ground
 *  2. bob says something
 *  3. bob hides into ground
 */

define(["creature"], function(creature){

    //boot場景，用來做一些遊戲啟動前的準備
    var tutorialStage = function(game){
        var func = function() {

            //可調參數 start **************************************

            //殭屍等待答案時間
            var ZOMBIE_SEC_TO_WAIT_FOR_ANSWER = 10;
            //殭屍答案打字區 prefix
            var ZOMBIE_ANSWER_TYPING_AEAR_PREFIX = creature.ansPrefix;
            //血格總數量
            var PLAYER_NUMBER_OF_HEALTH_BARS = 10;
            // 可調參數 end ************************************

            var isDebug;
            var hintText; // 左上角的text sprite
            var healthBars; //血條 graphics 物件
            var hpText; // 血條前顯示字樣
            var PLAYER_CURRENT_HEALTH; //玩家血量
            var bgMusic; // 背景音樂
            var zombieGrrsArray = []; //Array<audio> 殭屍叫聲, 這個不要放creature裡 @see zombieGrrrrr()
            var zombieGroup;

            var StateEnum = {"introductionBegin":1,
                             "introductionEnd":2,
                             "firstZombieBegin":3,
                             "firstZombieEnd":4,
                             "zombieMoving": 5,
                             "introducting": 6,
                             "lastDialogBegin": 7,
                             "lastDialogEnd": 8,
                             "lastDialogGoing": 9,
                             };
            var currentState; // 目前的劇情進展
            var TypingEnum = {"off":0, "dialog":1, "answer":2};

            var bob = null;

               // prevent backspace(delete) capture by firefox or chrome to 'go back'
            this.handleBackspace = function(e) {
                if (e.which === 8 && !$(e.target).is("input, textarea")) {
                    e.preventDefault();
                    console.log('press backspace');

                    if(focusedZombie) {
                        // keep 'Ans:'
                        if(focusedZombie.ansTypeArea.text.length > ZOMBIE_ANSWER_TYPING_AEAR_PREFIX.length) {
                            var ans = focusedZombie.ansTypeArea.text.substring(0, focusedZombie.ansTypeArea.text.length -1)
                            focusedZombie.setAnsText(ans);
                        }
                    }
                }
            };


            this.preload = function(){
            };

            this.create = function(){

                game.physics.startSystem(Phaser.Physics.ARCADE);
                game.add.tileSprite(0, 0, 800, 600, 'tutorialBg');

                // world邊界設定的比camera大一點，可以做搖晃效果
                game.world.setBounds(0, 0, game.world.width + 15, game.world.height);

                zombieGrrsArray.push(game.add.audio('zombieGrr1'));
                zombieGrrsArray.push(game.add.audio('zombieGrr4'));
                zombieGrrsArray.push(game.add.audio('zombieGrr10'));
                zombieGrrsArray.push(game.add.audio('zombieGrr11'));
                zombieGrrsArray.push(game.add.audio('zombieGrr15'));

                bgMusic = game.add.audio('bgmusic');
                // play(marker, position, volume, loop, forceRestart)
                bgMusic.play('', 0, 0.2, true);//loop. Tune down the volume so that other sound effects could be heard

                isDebug = getUrlVars()['debug'] === "1";

                // 血條位置
                PLAYER_CURRENT_HEALTH = 100;
                hpText = game.add.text(1, 10,
                                        "HP:",
                                        { font: "20px Arial", fill: "#FFFFFF", });
                healthBars = game.add.graphics(hpText.right + 5, 10);
                drawHealthBarsNoArg();

                //characterRising(); // Lono: I hate waiting
                //game.time.events.loop(Phaser.Timer.SECOND*0.3 , characterRising, this);
            };

            this.update = function() {
                characterRising();

                // 更新血量, don't update all the times...too costy
                //drawHealthBarsNoArg();
            }


            this.render = function() {
            }

            function characterRising() {
                if (!currentState) {
                    // show the introductory character
                    zombieGroup = game.add.group();
                    zombieGroup.enableBody = true;
                    zombieGroup.createMultiple(1, '');
                    zombieGroup.setAll('anchor.x', 0.5);
                    zombieGroup.setAll('anchor.y', 0.5);
                    zombieGroup.setAll('outOfBoundsKill', true);
                    var zombie = zombieGroup.getFirstExists(false);

                    if(zombie === null) { return; }

                    var zombieSprite = game.make.sprite(0, 0, 'zombieAppear');
                    zombieSprite.anchor.set(0.5, 0.5);
                    zombieSprite.scale.set(1.5, 1.5);
                    zombie.width = zombieSprite.width;
                    zombie.height = zombieSprite.height;
                    zombie.zombie = zombieSprite;
                    zombie.addChild(zombieSprite);


                    currentState = StateEnum.zombieMoving;

                    zombie.zombie.animations.add('appear');
                    zombie.zombie.animations.play('appear', 4, false);
                    zombie.zombie.animations.currentAnim.onComplete.add(function() {

                        zombie.zombie.loadTexture('zombieIdle', 0);
                        zombie.zombie.animations.add('idle');
                        zombie.zombie.animations.play('idle', 6, false);
                        zombie.zombie.animations.currentAnim.onComplete.add(function() {
                            currentState = StateEnum.introductionBegin;
                        zombie.zombie.animations.play('idle', 6, true);
                        }, this);

                    }, this);

                    zombie.reset(0.5*game.world.width, game.world.height - zombie.anchor.y*zombie.height - 50);

                    zombieGroup.bringToTop(zombie);
                    creature.zombieInit(game)(zombie);
                    zombie.dialogs = ["Welcome to coding of dead (press any key to continue)",
                                      "You are here to meet the great Bluemix® ?",
                                      "Then turn on your speakers for the best experience.",
                                      "Before you begin, I will test your coding power.",
                                      "Complete this hello world function.",
                                      "Hint: type 'HelloWorld' and press the ENTER key", // number 6
                                      "Good!               ",
                                      "My buddies will ask for more...",
                                      "Hints can be found on the right hand side",
                                      "or you can type 'yo' to cheat...",
                                      "Beware for your health at the top-left corner.",
                                      "If you failed, you will never see the great one.",
                                      "Good Luck!          "];
                    zombie.movingStyle = creature.movingStyle.static;

                    zombie.scale.setTo(1.0, 1.0);

                    focusedZombie = zombie;

                } else if (currentState == StateEnum.introductionBegin) {
                    currentState = StateEnum.introducting;
                    focusedZombie.showDialog();
                    focusedZombie.nextDialog();
                    typingMode(TypingEnum.dialog);
                }else if (currentState == StateEnum.introductionEnd) {
                    focusedZombie.hilight();
                    //focusedZombie.startCountdown(ZOMBIE_SEC_TO_WAIT_FOR_ANSWER);
                    typingMode(TypingEnum.answer);

                    // first zombie
                    currentState = StateEnum.firstZombieBegin;

                    // 註冊zombieAttack事件（signal, just like NSNotificationCenter）
                    focusedZombie.onAttackSignal.add(playerGetAttackByZombie, this);
                    // TODO 註冊zombieOnDeath 事件
                } else if (currentState == StateEnum.lastDialogBegin) {
                    currentState = StateEnum.lastDialogGoing;
                    focusedZombie.showDialog();
                    focusedZombie.nextDialog();
                    typingMode(TypingEnum.dialog);
                }
            }

            function hideAZombie(zombie) {
                zombie.zombie.loadTexture('zombieHide', 0);
                zombie.zombie.animations.add('hide');
                zombie.zombie.animations.play('hide', 11, false);
                zombie.zombie.animations.currentAnim.onComplete.add(function() {
                    killAZombie(zombie);

                    // move to next Stage
                    game.state.start('battle');

                }, this);

            }
            function killAZombie(zombieToKill) {

                zombieToKill.killThisZombie();
                typingMode(TypingEnum.off);

                if (focusedZombie == zombieToKill) {
                    focusedZombie = null;
                }
                if(hintText !== undefined
                        && hintText !== null) {
                    hintText.destroy();
                    hintText = null;
                }
            }

            /**
              * 殭屍叫聲還是由外部來load，要叫的時候再給進去。
              */
            function zombieGrrrrr(zomieToGrrr) {
              zomieToGrrr.Grrrrr(zombieGrrsArray);
            }

            function playerGetAttackByZombie(theZombieAttackingPlayer) {

              //focusedZombie.zombie.loadTexture('zombieAttack', 0);
              //focusedzombie.zombie.animations.add('attack1', [0, 1, 2]);
              //focusedzombie.zombie.animations.play('attack1', 6, false);
              //focusedzombie.zombie.animations.currentAnim.onComplete.add(function() {
                  //focusedzombie.zombie.animations.add('attack2', [3, 4, 5]);
                  //focusedzombie.zombie.animations.play('attack2', 6, false);
                  //attackedEffect(theZombieAttackingPlayer);
              //}, this);


            }

            function shakeScreen(){
              var bloodInTheFace = game.add.graphics(0,0);
              var poly = new Phaser.Polygon();
              poly.setTo([ new Phaser.Point(0, 0),
                            new Phaser.Point(game.world.width, 0),
                            new Phaser.Point(game.world.width, game.world.height),
                            new Phaser.Point(0, game.world.height) ]);
              bloodInTheFace.beginFill(0xB40404);
              bloodInTheFace.drawPolygon(poly.points);
              bloodInTheFace.endFill();
              bloodInTheFace.alpha = 0.0;
              // a cheap way to shaking up the camera
              game.time.events.add(Phaser.Timer.SECOND * 0.1, function() {
                // actually,  don't really need to nest all this...
                game.camera.x += 15;
                game.time.events.add(Phaser.Timer.SECOND * 0.1, function() {
                  game.camera.x -= 10;
                  game.time.events.add(Phaser.Timer.SECOND * 0.1, function() {
                    game.camera.x += 5;
                    game.time.events.add(Phaser.Timer.SECOND * 0.1, function() {
                      game.camera.x = 0;
                      bloodInTheFace.destroy();
                    }, this);
                  }, this);
                }, this);
              }, this);

            }

            function attackedEffect(theZombieAttackingPlayer) {
              focusedZombie.zombie.loadTexture('zombieIdle', 0);
              focusedzombie.zombie.animations.play('idle', 6, true);
              PLAYER_CURRENT_HEALTH -= 20;
              drawHealthBarsNoArg();
              // 紅畫面，搖視角效果
              var bloodInTheFace = game.add.graphics(0,0);
              var poly = new Phaser.Polygon();
              poly.setTo([ new Phaser.Point(0, 0),
                            new Phaser.Point(game.world.width, 0),
                            new Phaser.Point(game.world.width, game.world.height),
                            new Phaser.Point(0, game.world.height) ]);
              bloodInTheFace.beginFill(0xB40404);
              bloodInTheFace.drawPolygon(poly.points);
              bloodInTheFace.endFill();
              bloodInTheFace.alpha = 0.3;
              // a cheap way to shaking up the camera
              game.time.events.add(Phaser.Timer.SECOND * 0.1, function() {
                // 殭屍叫
                zombieGrrrrr(theZombieAttackingPlayer);
                // actually,  don't really need to nest all this...
                game.camera.x += 15;
                game.time.events.add(Phaser.Timer.SECOND * 0.1, function() {
                  game.camera.x -= 10;
                  game.time.events.add(Phaser.Timer.SECOND * 0.1, function() {
                    game.camera.x += 5;
                    game.time.events.add(Phaser.Timer.SECOND * 0.1, function() {
                      game.camera.x = 0;
                      bloodInTheFace.destroy();
                    }, this);
                  }, this);
                }, this);
              }, this);
            }

            function typingMode(typingEnum) {

                if (typingEnum == TypingEnum.off) {
                    game.input.keyboard.clearCaptures(); // this won't clear 'ESC' and 'backspace' registed somewhere else
                } else if (typingEnum == TypingEnum.dialog && currentState == StateEnum.introducting) {
                    game.input.keyboard.addCallbacks(this, null, null, function(char) {
                        if (!focusedZombie) { return; }
                        console.log('dialog mode on and key pressed: ' + char + 'in ascii number:' + char.charCodeAt());

                        var moreDialog = focusedZombie.nextDialog();
                        if (moreDialog >= 6 || moreDialog < 0) {
                            // nothing to say, move to battle mode
                            currentState = StateEnum.introductionEnd;
                        }
                    });
                } else if (typingEnum == TypingEnum.dialog && currentState == StateEnum.lastDialogGoing) {
                    game.input.keyboard.addCallbacks(this, null, null, function(char) {
                        if (!focusedZombie) { return; }
                        console.log('dialog mode on and key pressed: ' + char + 'in ascii number:' + char.charCodeAt());

                        var moreDialog = focusedZombie.nextDialog();
                        if (moreDialog < 0) {
                            currentState = StateEnum.lastDialogEnd;
                            // nothing to say, move to the next state
                            hideAZombie(focusedZombie);

                        }
                    });
                } else if (typingEnum == TypingEnum.answer) {
                    // typing mode on
                    game.input.keyboard.addCallbacks(this, null, null, function(char) {
                            if (!focusedZombie) { return; }
                            // don't forget ESC key down event is almost registed
                            // backspace key is prevented from browser capture at the top.
                            console.log('typing mode on and key pressed: ' + char + 'in ascii number:' + char.charCodeAt());
                            switch(char.charCodeAt()) {
                                case 0:
                                case 13:
                                // enter key
                                if(checkAnswer(focusedZombie, focusedZombie.ansTypeArea.text, 'HelloWorld')) {
                                  // zombie die!
                                  currentState = StateEnum.lastDialogBegin;
                                  focusedZombie.lolight();
                                } else {
                                  // player damaged
                                  clearZombieAnsTypeArea(focusedZombie);

                                  // bob is very peaceful
                                  //playerGetAttackByZombie(focusedZombie);

                                }
                                break;
                            default:
                                var ans = focusedZombie.ansTypeArea.text + char;
                                focusedZombie.setAnsText(ans);
                                break;
                                }
                    });
                }
            }

            /**
             * ansTypingAreaText : string - text from zombie.ansTypingArea (no trim)
             * return bool
             */
            function checkAnswer(zombieGotAnswer, ansTypingAreaText, correctAnswer) {
                var ans = ansTypingAreaText.substring(ZOMBIE_ANSWER_TYPING_AEAR_PREFIX.length, ansTypingAreaText.length);
                if(ans === 'yo') {
                  // cheat code
                  return true;
                }

                console.log('checking ans:' + ans);
                var correct = (ans === correctAnswer);
                var checkCaseSensitive = (ans.toLowerCase() === correctAnswer.toLowerCase());

                if (checkCaseSensitive && !correct){
                    focusedZombie.say("It's not correct. 'HelloWorld' is case sensitive!!!");
                }
                return correct;
            }

            function clearZombieAnsTypeArea(zombieToClearAns) {
                zombieToClearAns.clearAnsText();
            }

            function getUrlVars(){
                var vars = [], hash;
                var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
                for(var i = 0; i < hashes.length; i++)
                {
                    hash = hashes[i].split('=');
                    vars.push(hash[0]);
                    vars[hash[0]] = hash[1];
                }
                return vars;
            }

            function drawHealthBarsNoArg() {
              drawHealthBars(PLAYER_NUMBER_OF_HEALTH_BARS, PLAYER_CURRENT_HEALTH, healthBars);
            }

            /**
              畫血條
              totalNumOfBars : number - 滿血有多少格
              currentHealth : number - 目前血量，百分比。
              healthBarGraphicsObj: Graphics
              */
            function drawHealthBars(totalNumOfBars, currentHealth, healthBarGraphicsObj) {
              if(currentHealth < 0) {
                currentHealth = 0;
              }
              var healthPointInEachBar = 100 / totalNumOfBars;
              var numberOfBarFillWithHealth = Math.round(currentHealth / healthPointInEachBar);

              for(var i = 0; i < totalNumOfBars; i++) {
                var poly = new Phaser.Polygon();
                poly.setTo([ new Phaser.Point(0 + i * 20, 0),
                              new Phaser.Point(15 + i * 20, 0),
                              new Phaser.Point(15 + i * 20, 20),
                              new Phaser.Point(0 + i * 20, 20) ]);
                if(numberOfBarFillWithHealth > 0) {
                  healthBarGraphicsObj.beginFill(0xFF0000);
                  numberOfBarFillWithHealth--;
                } else {
                  healthBarGraphicsObj.beginFill(0xA4A4A4);
                }
                healthBarGraphicsObj.drawPolygon(poly.points);
                healthBarGraphicsObj.endFill();
              }
            }

            return this;
        }; // var func

        return func;
    }; //var battle

    return {
        tutorial: tutorialStage,
    };
});
