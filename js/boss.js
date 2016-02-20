/**
 *  handle final boss fight
 *
 *  1. boss shows up from top
 *  2. boss says some shit
 *  3. boss attack
 */

define(["creature"], function(creature){

    //boot場景，用來做一些遊戲啟動前的準備
    var bossStage = function(game){
        var func = function() {

            //可調參數 start **************************************

            //殭屍等待答案時間
            var ZOMBIE_SEC_TO_WAIT_FOR_ANSWER = 10;
            //殭屍答案打字區 prefix
            var ZOMBIE_ANSWER_TYPING_AEAR_PREFIX = "Ans:";
            //血格總數量
            var PLAYER_NUMBER_OF_HEALTH_BARS = 5;
            // 可調參數 end ************************************

            var isDebug;
            var hintText; // 左上角的text sprite
            var healthBars; //血條 graphics 物件
            var hpText; // 血條前顯示字樣
            var PLAYER_CURRENT_HEALTH; //玩家血量
            var bgMusic; // 背景音樂
            var zombieGrrsArray = []; //Array<audio> 殭屍叫聲, 這個不要放creature裡 @see zombieGrrrrr()
            var zombieGroup;

            var StateEnum = {"introductionBegin":1, "introductionEnd":2, "firstZombieBegin":3, "firstZombieEnd":4, "zombieMoving": 5}
            var currentState; // 目前的劇情進展
            var TypingEnum = {"off":0, "dialog":1, "answer":2}

            var finalBoss = null;

            // prevent backspace(delete) capture by firefox or chrome to 'go back'
            this.handleBackspace = function(e) {
                if (e.which === 8 && !$(e.target).is("input, textarea")) {
                  e.preventDefault();

                  if (currentState == StateEnum.firstZombieBegin) {
                    if(finalBoss.ansTypeArea.text.length > ZOMBIE_ANSWER_TYPING_AEAR_PREFIX.length) {
                      finalBoss.ansTypeArea.text = finalBoss.ansTypeArea.text.substring(0, finalBoss.ansTypeArea.text.length -1)
                    }
                  }
                }
            };

            this.preload = function(){
                game.load.image('boss', 'boss.png');
                game.load.image('hell', 'hell.jpg');
            };

            this.create = function(){

                game.physics.startSystem(Phaser.Physics.ARCADE);
                game.add.tileSprite(-250, -150, 1250, 950, 'hell');

                // world邊界設定的比camera大一點，可以做搖晃效果
                game.world.setBounds(0, 0, game.world.width + 15, game.world.height);

                zombieGrrsArray.push(game.add.audio('zombieGrr1'));
                zombieGrrsArray.push(game.add.audio('zombieGrr4'));
                zombieGrrsArray.push(game.add.audio('zombieGrr10'));
                zombieGrrsArray.push(game.add.audio('zombieGrr11'));
                zombieGrrsArray.push(game.add.audio('zombieGrr15'));

                bgMusic = game.add.audio('bgmusic');
                bgMusic.play('', 0, 1, true);//loop

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
                    zombieGroup.createMultiple(1, 'boss');
                    zombieGroup.setAll('anchor.x', 0);
                    zombieGroup.setAll('anchor.y', 0);
                    zombieGroup.setAll('outOfBoundsKill', true);
                    var boss = zombieGroup.getFirstExists(false);

                    if(boss === null) { return; }
                    boss.reset(0.3*game.world.width, -400);

                    zombieGroup.bringToTop(boss);
                    boss = creature.zombieInit(game)(boss);
                    boss.dialogs = ["Welcome to Hell", "I'm your boss", "if you can solve this problem"];
                    boss.movingStyle = creature.movingStyle.static;

                    boss.scale.setTo(3.0, 3.0);

                    finalBoss = boss;
                    currentState = StateEnum.zombieMoving;

                } else if (currentState == StateEnum.zombieMoving) {
                    finalBoss.y += 7.0;
                    if (finalBoss.y > game.world.height - 600.0) {
                        currentState = StateEnum.introductionBegin;
                        finalBoss.showDialog();
                        finalBoss.nextDialog();
                        typingMode(TypingEnum.dialog);
                    }
                }else if (currentState == StateEnum.introductionEnd) {
                    finalBoss.hilight();
                    finalBoss.startCountdown(ZOMBIE_SEC_TO_WAIT_FOR_ANSWER);
                    typingMode(TypingEnum.answer);

                    // first zombie
                    currentState = StateEnum.firstZombieBegin;

                    // 註冊zombieAttack事件（signal, just like NSNotificationCenter）
                    finalBoss.onAttackSignal.add(playerGetAttackByZombie, this);
                    // TODO 註冊zombieOnDeath 事件
                }
            }

            function killAZombie(zombieToKill) {
                zombieToKill.killThisZombie();
                typingMode(TypingEnum.off);

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
                } else if (typingEnum == TypingEnum.dialog) {
                    game.input.keyboard.addCallbacks(this, null, null, function(char) {
                        if (!finalBoss) { return; }
                        console.log('dialog mode on and key pressed: ' + char + 'in ascii number:' + char.charCodeAt());

                        var moreDialog = finalBoss.nextDialog();
                        if (moreDialog < 0) {
                            // nothing to say, move to battle mode
                            currentState = StateEnum.introductionEnd;
                        }
                    });
                } else if (typingEnum == TypingEnum.answer) {
                    if (!finalBoss) { return; }
                    // typing mode on
                    game.input.keyboard.addCallbacks(this, null, null, function(char) {
                            // don't forget ESC key down event is almost registed
                            // backspace key is prevented from browser capture at the top.
                            console.log('typing mode on and key pressed: ' + char + 'in ascii number:' + char.charCodeAt());
                            switch(char.charCodeAt()) {
                                case 0:
                                    // enter key
                                if(checkAnswer(finalBoss, finalBoss.ansTypeArea.text, 'HelloWorld')) {
                                  // zombie die!
                                  killAZombie(finalBoss);
                                } else {
                                  // player damaged
                                  clearZombieAnsTypeArea(finalBoss);
                                  playerGetAttackByZombie(finalBoss);

                                }
                                break;
                            default:
                                finalBoss.ansTypeArea.text += char;
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
                console.log('checking ans:' + ans);
                return (ans === correctAnswer);
            }

            function clearZombieAnsTypeArea(zombieToClearAns) {
                zombieToClearAns.ansTypeArea.text = ZOMBIE_ANSWER_TYPING_AEAR_PREFIX;
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
        boss: bossStage,
    };
});
