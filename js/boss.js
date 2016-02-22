/**
 *  handle final boss fight
 *
 *  1. boss shows up from top
 *  2. boss says some shit
 *  3. boss attack
 */

define(["creature", "CodeQuestionbase"], function(creature, CodeQuestionbase){

    //boot場景，用來做一些遊戲啟動前的準備
    var bossStage = function(game, bossAnswerDiv, aceeditorObj, questionTextArea, codeRunButton){
        var func = function() {

            //可調參數 start **************************************

            //殭屍等待答案時間
            var ZOMBIE_SEC_TO_WAIT_FOR_ANSWER = 11;
            //殭屍答案打字區 prefix
            var ZOMBIE_ANSWER_TYPING_AEAR_PREFIX = creature.ansPrefix;
            //血格總數量
            var PLAYER_NUMBER_OF_HEALTH_BARS = 10;

            var BLUEMIX_JS_SANDBOX_SERVER_URL = 'http://trytrysee.mybluemix.net/restful/bmsandbox';
            // 可調參數 end ************************************

            var isDebug;
            var hintText; // 左上角的text sprite
            var healthBars; //血條 graphics 物件
            var hpText; // 血條前顯示字樣
            var PLAYER_CURRENT_HEALTH = 0; //玩家血量
            var zombieGrrsArray = []; //Array<audio> 殭屍叫聲, 這個不要放creature裡 @see zombieGrrrrr()
            var gunshot; // gunshot sound
            var zombieGroup;

            var StateEnum = {"introductionBegin":1, "introductionEnd":2, "firstZombieBegin":3, "firstZombieEnd":4, "zombieMoving": 5}
            var currentState = null; // 目前的劇情進展
            var TypingEnum = {"off":0, "dialog":1, "answer":2}

            var finalBoss = null;
            var shakeLoop = null; // for initial boss movement shaking
            var explosionSound = null; // boss dying sound effect
            var shakeSound = null; // earthquake sound effect to show boss
            var currentCodeQuestion; //目前做的題目
            // 讀取bluemix錯誤計數
            var bmerrorCount;

            var hasSubmit = null;
            var isPlayerDead = false;

            this.init = function () {
              if(arguments.length > 0) {
                PLAYER_CURRENT_HEALTH = arguments[0]; // 前一個state傳過來的 player health
              }
              if (PLAYER_CURRENT_HEALTH <= 0) {
                  PLAYER_CURRENT_HEALTH = 100;
              }
            };

            this.preload = function(){
            };

            this.create = function(){
                shakeSound = game.add.audio('earthquake');
                explosionSound = game.add.audio('explosion');

                bmerrorCount = 0;

                game.physics.startSystem(Phaser.Physics.ARCADE);
                game.add.tileSprite(0, 0, 800, 600, 'bossBg');

                // world邊界設定的比camera大一點，可以做搖晃效果
                game.world.setBounds(0, 0, game.world.width + 15, game.world.height);

                zombieGrrsArray.push(game.add.audio('zombieGrr1'));
                zombieGrrsArray.push(game.add.audio('zombieGrr4'));
                zombieGrrsArray.push(game.add.audio('zombieGrr10'));
                zombieGrrsArray.push(game.add.audio('zombieGrr11'));
                zombieGrrsArray.push(game.add.audio('zombieGrr15'));

                gunshot = game.add.audio('gunshot')

                isDebug = getUrlVars()['debug'] === "1";

                // 血條位置
                if(PLAYER_CURRENT_HEALTH <= 0) { //前一個state會傳血量過來 fail safe 才變成100
                  PLAYER_CURRENT_HEALTH = 100;
                }
                hpText = game.add.text(1, 10,
                                        "HP:",
                                        { font: "20px Arial", fill: "#FFFFFF", });
                healthBars = game.add.graphics(hpText.right + 5, 10);
                drawHealthBarsNoArg();

                //characterRising(); // Lono: I hate waiting

            };

            function bossSaySomething(){
                if (finalBoss
                    && !hasSubmit
                    && currentState == StateEnum.firstZombieBegin)
                {
                    finalBoss.say("Click 'RUN' at the bottom-right corner if you don't know what to do");
                }
            }
            this.update = function() {
                characterRising();
            }


            this.render = function() {
            }

            /**
              * check code in ace
              */
            function runEditorCode() {

              if (!finalBoss){
                  return;
              }
              hasSubmit = true;

              if(aceeditorObj.getValue() === 'yo') {
                // cheat
                finalBoss.say('aaaah~ Bluemix the Holy one, save me~');
                killBoss(finalBoss);
                return;
              }

              // check syntax first
              var annotations = aceeditorObj.getSession().getAnnotations()
              if(annotations.length > 0) {
                  for(var i = 0; i < annotations.length; i++) {
                      var foo = annotations[i];
                      if(foo.type !== "warning") {  // ignore warnings
                          finalBoss.say('The Code doesn\'t even compile.');
                          playerGetAttackByZombie(finalBoss);
                          return;
                      }
                  }
              }

              // TODO check function name, function name must match
              var inputArray = currentCodeQuestion.theinputArray;
              var functionName = currentCodeQuestion.functionName;
              var expectedOutput = currentCodeQuestion.expectedOutput;

              var postfix = currentCodeQuestion.getFunctionCallString();
              var runcode = aceeditorObj.getValue() + '\n' + postfix + ';';

              finalBoss.say('Nice! Checking your code with the holy Bluemix ...');
              console.log('before sending to Bluemix runcode:' + runcode);

              $.ajax({
                type: "POST",
                url: BLUEMIX_JS_SANDBOX_SERVER_URL,
                data: {'jscode':encodeURIComponent(runcode)},
                dataType: 'json',
                timeout: 5000,
                error: function(x, t, m) {
                  // error handler
                  finalBoss.say('Bluemix is not here, try again ... (error when loading service...)');
                  if(bmerrorCount++ >= 2) {
                    game.time.events.add(Phaser.Timer.SECOND , function() {
                      finalBoss.say('Fine! I will let you pass!');
                      game.time.events.add(Phaser.Timer.SECOND*2, function() {
                        killBoss(finalBoss);
                      }, this);
                    }, this);
                  }
                }
              }).done(function(data) {
                // {"result":"TimeoutError","console":[]}
                // {"result":"null","console":[123]}
                // {"result":"'SyntaxError: Unexpected token )'","console":[]}
                console.log('return from bluemix ' + JSON.stringify(data));
                if(data.result === 'TimeoutError') {
                  // taking too long
                  finalBoss.say('Your code takes too long to run! Shame!');
                  playerGetAttackByZombie(finalBoss);
                }  else if(data.result === 'null') {
                  // return null!
                  finalBoss.say('It returns NULL! LMAO!!!!');
                  playerGetAttackByZombie(finalBoss);
                } else if(data.result.indexOf('SyntaxError') > -1) {
                  // sytax error
                  finalBoss.say('The Code doesn\'t even compile.');
                  playerGetAttackByZombie(finalBoss);
                } else if (JSON.stringify(data.result) === JSON.stringify(expectedOutput)) {
                  // answer is currect!
                  finalBoss.say('aaaah~ Bluemix the Holy one, save me~~');
                  killBoss(finalBoss);
                } else {
                  // wrong answer
                  finalBoss.say('WRONG! your code return ' + JSON.stringify(data.result) + ' with input ' + JSON.stringify(inputArray));
                  playerGetAttackByZombie(finalBoss);
                }
              });
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
                    var boss = zombieGroup.getFirstExists(false);

                    if(boss === null) { return; }

                    var zombieSprite = game.make.sprite(0, 0, 'bossIdle');
                    zombieSprite.anchor.set(0.5, 0.5);
                    zombieSprite.scale.set(1.5, 1.5);
                    boss.width = zombieSprite.width;
                    boss.height = zombieSprite.height;
                    boss.zombie = zombieSprite;
                    boss.addChild(zombieSprite);

                    boss.zombie.animations.add('idle');
                    boss.zombie.animations.play('idle', 6, true);

                    boss.reset(0.5*game.world.width, -400);

                    zombieGroup.bringToTop(boss);
                    boss = creature.zombieInit(game)(boss);
                    boss.dialogs = ["Impressive, human!",
                                    "But your journey ends here.",
                                    "The Bluemix only meet the smart one.",
                                    "Solve my quiz or be gone!"
                                   ];
                    boss.movingStyle = creature.movingStyle.static;

                    boss.scale.setTo(1.0, 1.0);

                    finalBoss = boss;
                    currentState = StateEnum.zombieMoving;

                    // play(marker, position, volume, loop, forceRestart)
                    shakeSound.play('', 0, 1.0, true);//loop

                    shakeScreen();
                    shakeLoop = game.time.events.loop(Phaser.Timer.SECOND*0.2, shakeScreen, this);

                } else if (currentState == StateEnum.zombieMoving) {
                    finalBoss.y += 7.0;
                    if (finalBoss.y > game.world.height - 370.0) {
                        if (shakeLoop) {
                            // remove shakeloop earlier, otherwise the screen will shake when the boss is on the ground
                            game.time.events.remove(shakeLoop);
                            shakeLoop = null;

                            // stop the shaking sound gracefully
                            game.time.events.loop(Phaser.Timer.SECOND * 0.1, function() {
                                if (!shakeSound) {return;}
                                if (shakeSound.volume <= 0.0) {
                                    shakeSound.stop();
                                    return;
                                }
                                shakeSound.volume -= 0.1;
                            });

                        }
                    }
                    if (finalBoss.y > game.world.height - 300.0) {
                        currentState = StateEnum.introductionBegin;
                        finalBoss.showDialog();
                        finalBoss.nextDialog();
                        typingMode(TypingEnum.dialog);
                    }
                }else if (currentState == StateEnum.introductionEnd) {
                    //finalBoss.hilight();  不要hilight，反正只有一個boss，也不需要顯示字。

                    // 顯示問題
                    currentCodeQuestion = CodeQuestionbase.pickQuestion();
                    questionTextArea.html(currentCodeQuestion.question);
                    aceeditorObj.setValue(currentCodeQuestion.codeTemplate, -1);

                    //魔王關答案區打開
                    bossAnswerDiv.show();
                    codeRunButton.show();
                    //Run按鈕加上event
                    codeRunButton.click(runEditorCode);

                    finalBoss.startCountdown(ZOMBIE_SEC_TO_WAIT_FOR_ANSWER);
                    typingMode(TypingEnum.answer);

                    // first zombie
                    currentState = StateEnum.firstZombieBegin;
                    game.time.events.loop(Phaser.Timer.SECOND*5.0 , bossSaySomething, this);


                    // 註冊zombieAttack事件（signal, just like NSNotificationCenter）
                    finalBoss.onAttackSignal.add(playerGetAttackByZombie, this);
                    // TODO 註冊zombieOnDeath 事件
                }
            }

            this.shutdown = function(){
                typingMode(TypingEnum.off);
                bossAnswerDiv.hide();
                codeRunButton.hide();
                if(hintText !== undefined
                        && hintText !== null) {
                    hintText.destroy();
                    hintText = null;
                }


                if (questionTextArea) {
                    questionTextArea.html('');
                }
            }

            function killBoss(zombie) {
                if (!finalBoss){
                    return;
                }
                finalBoss = null;

                if (explosionSound) {
                    explosionSound.play();
                }

                zombie.zombie.loadTexture('bossDie', 0);
                zombie.zombie.animations.add('die');
                zombie.zombie.animations.play('die', 3, false);
                zombie.zombie.animations.currentAnim.onComplete.add(function() {

                    killAZombie(zombie);
                    currentState = StateEnum.firstZombieEnd;



                    // move to next Stage
                    game.state.start('victory');

                    // TODO game over

                }, this);
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
              if (!finalBoss) {return;}

              finalBoss.zombie.loadTexture('bossAttack', 0);
              finalBoss.zombie.animations.add('attack1', [0, 1, 2]);
              finalBoss.zombie.animations.play('attack1', 6, false);
              finalBoss.zombie.animations.currentAnim.onComplete.add(function() {
                  finalBoss.zombie.animations.add('attack2', [3, 4, 5]);
                  finalBoss.zombie.animations.play('attack2', 6, false);
                  attackedEffect(finalBoss);
              }, this);


            }

            function playerAttack(zombie) {

                if (!zombie) {return;}
                if (gunshot) {
                    gunshot.play();
                }
                // should zombie moan?
                zombieGrrrrr(zombie);

                zombie.zombie.loadTexture('bossAttack', 0);
                zombie.zombie.animations.add('attack1', [0]);
                zombie.zombie.animations.play('attack1', 6, false);
                zombie.zombie.animations.currentAnim.onComplete.add(function() {
                    zombie.zombie.loadTexture('bossIdle', 0);
                    zombie.zombie.animations.add('idle');
                    zombie.zombie.animations.play('idle', 6, true);
                }, this);
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
              if (!finalBoss) {return;}
              finalBoss.zombie.loadTexture('bossIdle', 0);
              finalBoss.zombie.animations.play('idle', 6, true);
              PLAYER_CURRENT_HEALTH -= 20;

              if (PLAYER_CURRENT_HEALTH <= 0){
                  isPlayerDead = true;
                  finalBoss = null; // disable all animations
              }

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
                      if (isPlayerDead) {
                          game.States.mLastState = game.state.current;
                          game.state.start('lose');
                      }
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
                } else if (typingEnum == TypingEnum.answer && StateEnum.firstZombieBegin) {
                    // typing mode on
                    game.input.keyboard.addCallbacks(this, null, null, function(char) {
                            if (!finalBoss) { return; }
                            // don't forget ESC key down event is almost registed
                            // backspace key is prevented from browser capture at the top.
                            console.log('typing mode on and key pressed: ' + char + 'in ascii number:' + char.charCodeAt());
                            switch(char.charCodeAt()) {
                              /*
                                case 0:
                                case 13:
                                    // enter key
                                if(checkAnswer(finalBoss, finalBoss.ansTypeArea.text, 'HelloWorld')) {
                                  // zombie die!
                                  playerAttack(finalBoss);

                                  killBoss(finalBoss);

                                } else {
                                  // player damaged
                                  clearZombieAnsTypeArea(finalBoss);
                                  playerGetAttackByZombie(finalBoss);

                                }
                                break;
                                */
                            default:
                                playerAttack(finalBoss);

                                //finalBoss.ansTypeArea.text += char;
                                break;
                                }
                    });
                }
            }

            /**
             * ansTypingAreaText : string - text from zombie.ansTypingArea (no trim)
             * return bool
             */
             /*
            function checkAnswer(zombieGotAnswer, ansTypingAreaText, correctAnswer) {
                var ans = ansTypingAreaText.substring(ZOMBIE_ANSWER_TYPING_AEAR_PREFIX.length, ansTypingAreaText.length);
                console.log('checking ans:' + ans);
                return (ans === correctAnswer);
            }
            */

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
