/**
 *  handle battle screen
 *
 */


define(["creature", "ShortQuiz"], function(creature, ShortQuiz){

    //boot場景，用來做一些遊戲啟動前的準備
    var battle = function(game, questionTextArea){
        var func = function() {

            //可調參數 start **************************************

            //殭屍x軸出現位置範圍（寬度的百分比)
            var ZOMBIE_APPEARING_POSITISION_IN_X_PERCENTAGE_FROM = 0.2;
            var ZOMBIE_APPEARING_POSITISION_IN_X_PERCENTAGE_TO = 0.8;
            // 進下一關前要打多少殭屍
            var MAX_ZOMBIE = 5;
            //殭屍一開始的大小
            var ZOMBIE_INIT_SCALE = 0.3;
            // 這個會影響放大倍數算法，也就會間接影響到zombie meet play判斷
            var ZOMBIE_TARGET_Y = 400.0;
            // 殭屍碰到player的放大倍數
            var ZOMBIE_MEET_PLAYER_SCALE = 1.0;

            var ZOMBIE_START_Y = 40.0; // half of the initial zombie hieght
            //殭屍等待答案時間
            var ZOMBIE_SEC_TO_WAIT_FOR_ANSWER = 10;
            //殭屍答案打字區 prefix
            var ZOMBIE_ANSWER_TYPING_AEAR_PREFIX = creature.ansPrefix;
            //血格總數量
            var PLAYER_NUMBER_OF_HEALTH_BARS = 10;
            // 殭屍攻擊點數
            var ZOMBIE_HIT_POINT = 10;
            // 殭屍出現時間間隔 秒
            var ZOMBIE_APPEAR_INTERVAL = 0.5;
            // 可調參數 end ************************************


            var zombieGroup;
            var ZOMBIE_APPEARING_POSITISION_IN_X_POINT_FROM;
            var ZOMBIE_APPEARING_POSITISION_IN_X_POINT_TO;
            var ZOMBIE_APPEARING_POSITISION_IN_X_POINT_CENTER;
            var isAllZombiePaused;
            var isDebug;
            var zombieWaitingForAnswer; // 被點到，或是碰到player的殭屍
            var hintText; // 左上角的text sprite
            var healthBars; //血條 graphics 物件
            var hpText; // 血條前顯示字樣
            var PLAYER_CURRENT_HEALTH; //玩家血量
            var zombieGrrsArray = []; //Array<audio> 殭屍叫聲, 這個不要放creature裡 @see zombieGrrrrr()
            var gunshot;
            var zombieCount; // dead zombie count

            var StateEnum = {"introductionBegin":1, "introductionEnd":2, "firstZombieBegin":3, "firstZombieEnd":4}
            var TypingEnum = {"off":0, "dialog":1, "answer":2}
            var currentState; // 目前的劇情進展

            var shortQuizCollection; //Array<ShortQuiz>
            var QuizIndex = 0;
            var isFirstZombie;
            var onGoingKill = false;
            var isPlayerDead = false;


            // prevent backspace(delete) capture by firefox or chrome to 'go back'
            this.handleBackspace = function(e) {
                if (e.which === 8 && !$(e.target).is("input, textarea")) {
                    e.preventDefault();
                    console.log('press backspace');

                    if(isAnyZombieWaitingForAnswer()) {
                        // keep 'Ans:'
                        if(zombieWaitingForAnswer.ansTypeArea.text.length > ZOMBIE_ANSWER_TYPING_AEAR_PREFIX.length) {
                            var ans = zombieWaitingForAnswer.ansTypeArea.text.substring(0, zombieWaitingForAnswer.ansTypeArea.text.length -1)
                            zombieWaitingForAnswer.setAnsText(ans);
                        }
                    }
                }
            };

            this.preload = function(){

            };

            this.create = function(){

                QuizIndex = 0;
                zombieCount = 0;
                isFirstZombie = true;
                game.physics.startSystem(Phaser.Physics.ARCADE);
                game.add.tileSprite(0, 0, 800, 600, 'gameBg');

                // world邊界設定的比camera大一點，可以做搖晃效果
                game.world.setBounds(0, 0, game.world.width + 15, game.world.height);

                // Short quiz colleciton
                shortQuizCollection = [];
                shortQuizCollection.push(new ShortQuiz.ShortQuiz('Put first 10 digits of Pi in each element of an Array. <br/> eg: [ "3", "1", "4", "1", "5", "9", "2", "6", "5", "3" ] <br/><br/><b>Hint: Math.PI.toString().<span style="color:#F7FE2E">substring(0, 11)</span>.replace(\'.\', \'\').split(\'\');</b>', 'Math.PI.toString().___.replace(\'.\', \'\').split(\'\');', 'substring(0,11)'));
                shortQuizCollection.push(new ShortQuiz.ShortQuiz('Insert an array in another array.<br/>  var a = [1,2,3,7,8,9];<br/>var b = [4,5,6]; <br/>var insertIndex = 3; <br/>Make a = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];  <br/><br/><b>Hint: a.splice.apply(a, Array.<span style="color: #F7FE2E">concat</span>(insertIndex, 0, b));</>', 'a.splice.apply(a, Array.__(insertIndex, 0, b));', 'concat'));
                shortQuizCollection.push(new ShortQuiz.ShortQuiz('What will the code below output?<br/>console.log(0.1 + 0.2 == 0.3);<br/><br/><b>Hint: <span style="color: #F7FE2E">false</span></b>', 'console.log(0.1 + 0.2 == 0.3);', 'false'));
                shortQuizCollection.push(new ShortQuiz.ShortQuiz('Reverse string. <br/><br/><b>Hint: "string".split("").reverse().<span style="color: #F7FE2E">join</span><BR>("");</b>', '"string".split("").reverse().__("");', 'join'));
                shortQuizCollection.push(new ShortQuiz.ShortQuiz('Swap two variables a and b without the use of a temp. <br/><br/><b>Hint: <span style="color: #F7FE2E">[a,b]=[b,a];</span></b>', 'Swap two variables a and b \nwithout the use of a temp.', '[a,b]=[b,a];'));
                //shortQuizCollection.push(new ShortQuiz.ShortQuiz('Complete this one line function. <br/>function is_email(id){ return _______.test(id);} <br/><br/><b>Hint: function is_email(id){return (/^([\\w!.%+\\-\\*])+<span style="color: #F7FE2E">@</span>([\\w\\-])+(?:\\.[\\w\\-]+)+$/).test(id);}</b>', '(/^([\\w!.%+\\-\\*])+█([\\w\\-])+(?:\\.[\\w\\-]+)+$/)\n // replace █', '@'));

                shortQuizCollection = shuffle(shortQuizCollection);

                zombieGrrsArray.push(game.add.audio('zombieGrr1'));
                zombieGrrsArray.push(game.add.audio('zombieGrr4'));
                zombieGrrsArray.push(game.add.audio('zombieGrr10'));
                zombieGrrsArray.push(game.add.audio('zombieGrr11'));
                zombieGrrsArray.push(game.add.audio('zombieGrr15'));

                gunshot = game.add.audio('gunshot')

                // pre-calculation
                ZOMBIE_APPEARING_POSITISION_IN_X_POINT_FROM = Math.floor(game.world.width * ZOMBIE_APPEARING_POSITISION_IN_X_PERCENTAGE_FROM);
                ZOMBIE_APPEARING_POSITISION_IN_X_POINT_TO = Math.floor(game.world.width * ZOMBIE_APPEARING_POSITISION_IN_X_PERCENTAGE_TO);
                ZOMBIE_APPEARING_POSITISION_IN_X_POINT_CENTER = (ZOMBIE_APPEARING_POSITISION_IN_X_POINT_TO - ZOMBIE_APPEARING_POSITISION_IN_X_POINT_FROM) /2;

                zombieGroup = game.add.group();
                zombieGroup.enableBody = true;
                zombieGroup.createMultiple(MAX_ZOMBIE + 5, ''); // we need some buffer
                zombieGroup.setAll('anchor.x', 0.5);
                zombieGroup.setAll('anchor.y', 0.5);
                zombieGroup.setAll('outOfBoundsKill', true);

                isAllZombiePaused = false;
                isDebug = getUrlVars()['debug'] === "1";


                var keyEsc = game.input.keyboard.addKey(Phaser.Keyboard.ESC);
                keyEsc.onDown.add(pressEsc, this);

                // 血條位置
                PLAYER_CURRENT_HEALTH = 100;
                hpText = game.add.text(1, 10,
                                        "HP:",
                                        { font: "20px Arial", fill: "#FFFFFF", });
                healthBars = game.add.graphics(hpText.right + 5, 10);
                drawHealthBarsNoArg();

                zombieRising(); // Lono: I hate waiting
                game.time.events.loop(Phaser.Timer.SECOND * ZOMBIE_APPEAR_INTERVAL, zombieRising, this);
                //game.time.events.loop(Phaser.Timer.SECOND * 2, zombieRising, this);
            };

            this.update = function() {
                if(isAllZombiePaused === false) {
                    zombieGroup.forEachAlive(function(zombie) {

                        if (zombie.movingStyle == creature.movingStyle.scale){

                            var newscale = ((zombie.y - ZOMBIE_START_Y)/ZOMBIE_TARGET_Y) * (ZOMBIE_MEET_PLAYER_SCALE - ZOMBIE_INIT_SCALE) + ZOMBIE_INIT_SCALE;
                            zombie.scale.set(newscale);
                        }

                        if(zombie.scale.x > ZOMBIE_MEET_PLAYER_SCALE
                            && isAnyZombieWaitingForAnswer() === false) {
                            // zombie meet player
                            console.log('meet the player');
                            pauseAllAliveZombies();
                            zombie.zIndexBeforeClicked = zombie.z;
                            zombieGroup.bringToTop(zombie);
                            if(isDebug) {
                                console.log("zombie was on " + zombie.zIndexBeforeClicked + ", and moved to front at " + zombie.z);
                            }
                            zombieWaitingForAnswer = zombie;
                            zombieWaitingForAnswer.isAbleToEsc = false;
                            zombieWaitingForAnswer.hilight();
                            zombieCount += 1;

                            questionTextArea.html(zombieWaitingForAnswer.getShortQuizQuestionDescription);

                            if (currentState == StateEnum.introductionEnd) {
                                zombie.hilight();
                                zombie.startCountdown(ZOMBIE_SEC_TO_WAIT_FOR_ANSWER);
                                typingMode(TypingEnum.answer);
                            }
                        }

                    }, this);
                }

                // 更新血量, don't update all the times...too costy
                //drawHealthBarsNoArg();
            }


            this.render = function() {

                if(isDebug) {
                    var foo = zombieGroup.getFirstAlive();
                    if(foo !== undefined && foo !== null) {
                        game.debug.bodyInfo(foo, 20, 32);
                    }
                }
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

            function zombieRising() {
                if (!currentState) {
                    currentState = StateEnum.introductionEnd;
                }
                if(isAllZombiePaused) {
                    return;
                }

                var zombie = zombieGroup.getFirstExists(false);
                if(zombie === null) {
                    return;
                }
                var zombieSprite = game.make.sprite(0, 0, 'zombieGo');
                zombieSprite.anchor.set(0.5, 0.5);
                zombieSprite.scale.set(1.5, 1.5);
                zombie.width = zombieSprite.width;
                zombie.height = zombieSprite.height;
                zombie.zombie = zombieSprite;
                zombie.addChild(zombieSprite);

                // "undo" anchor effect
                // zombie appearing position x-axis
                var x  =  game.rnd.integerInRange(ZOMBIE_APPEARING_POSITISION_IN_X_POINT_FROM,
                                                  ZOMBIE_APPEARING_POSITISION_IN_X_POINT_TO);
                zombie.scale.setTo(ZOMBIE_INIT_SCALE,ZOMBIE_INIT_SCALE);
                var anchor = zombie.anchor;
                var width = zombie.width;
                var height = zombie.height;
                zombie.reset(x - anchor.x*width, 15.0 + anchor.y*height);

                zombieGroup.sendToBack(zombie);

                zombie.body.velocity.y = 30.0;
                zombie.body.acceleration.y = 160.0;

                if (isFirstZombie) {
                    // let first zombie move faster
                    zombie.body.velocity.y = 80.0;

                    // move straight to the player
                    zombie.x = 0.3*game.world.width;
                    isFirstZombie = false;
                }
                zombie.body.velocity.x = game.rnd.integerInRange(10, 25);
                zombie.body.acceleration.x = game.rnd.realInRange(3.0, 4.6);

                // we don't want zombies occlude each other
                var randomOffset = game.rnd.realInRange(0, game.world.width*0.05);
                if(x >= ZOMBIE_APPEARING_POSITISION_IN_X_POINT_CENTER) { //出現位置靠右邊的往左走
                    zombie.body.velocity.x = game.rnd.integerInRange(-10, -25);
                    zombie.body.acceleration.x = game.rnd.realInRange(-3, -4.2);
                } else {
                    // 左邊的靠左，右邊的靠右
                    randomOffset = -randomOffset;
                }

                var t = 3.0; // this value controls how big the offset is. the larger the value, the bigger offset

                // Lono: fix accerleration, find a velocity that can move zombie to middle of screen
                // v0t + 0.5*a*t^2 = x
                // v0 = x/t - 0.5*a*t
                // a = 2x/(t^2) - 2V/t
                // Lono: fix acceleration
                //zombie.body.velocity.x = (0.2*game.world.width - zombie.x)/t - 0.5*zombie.body.acceleration.x*t;

                // Lono: fix velocity, looks more natural
                zombie.body.acceleration.x = 2.0*(0.3*game.world.width - zombie.x + randomOffset)/(t*t) - 2.0*zombie.body.velocity.x/t;

                zombie.zombie.loadTexture('zombieGo', 0);
                zombie.zombie.animations.add('go');
                zombie.zombie.animations.play('go', 10, true);
                zombie = creature.zombieInit(game)(zombie);

                // 註冊zombieAttack事件（signal, just like NSNotificationCenter）
                zombie.onAttackSignal.add(playerGetAttackByZombie, this);
                // TODO 註冊zombieOnDeath 事件

                if (!QuizIndex)
                {
                    QuizIndex = 0;
                }

                if (QuizIndex > shortQuizCollection.length - 1) {
                    QuizIndex = 0;
                }
                zombie.setShortQuiz( shortQuizCollection[QuizIndex]);
                QuizIndex += 1;

                if(isDebug) {
                    console.log("live counting:" + zombieGroup.countLiving() + ", dead counting:" +zombieGroup.countDead());
                }
            }

            function isAnyZombieWaitingForAnswer() {
                return (zombieWaitingForAnswer !== undefined
                        &&
                            zombieWaitingForAnswer !== null);
            }

            function pressEsc() {
                //有殭屍再等待作答，同時是可以逃離的（play被殭屍遇上就不能逃離)
                if(isAnyZombieWaitingForAnswer()
                   && zombieWaitingForAnswer.isAbleToEsc) {

                       zombieCancelWaiting();
                       hintText.destroy();
                       hintText = null;
                   }

            }

            function pauseAllAliveZombies() {
                isAllZombiePaused = true;

                zombieGroup.forEachAlive(function(zombie_foo) {
                    zombie_foo.body.enable = false;
                    zombie_foo.zombie.loadTexture('zombieIdle', 0);
                    zombie_foo.zombie.animations.add('idle');
                    zombie_foo.zombie.animations.play('idle', 6, true);
                }, this);

            }

            function resumeAllPasuedZombies() {
                zombieGroup.forEachAlive(function(zombie_foo) {
                    zombie_foo.body.enable = true;
                    zombie_foo.zombie.loadTexture('zombieGo', 0);
                    zombie_foo.zombie.animations.add('go');
                    zombie_foo.zombie.animations.play('go', 10, true);
                }, this);

                isAllZombiePaused = false;
            }

            /**
             * 殭屍取消作答（或是時間到停止作答）
             */
            function zombieCancelWaiting() {
                clearZombieAnsTypeArea(zombieWaitingForAnswer);
                zombieWaitingForAnswer.parent.setChildIndex(zombieWaitingForAnswer, zombieWaitingForAnswer.zIndexBeforeClicked);
                zombieWaitingForAnswer = null;
                resumeAllPasuedZombies();
                typingMode(TypingEnum.off);
            }

            function killAZombieWithAnimation(zombieToKill) {

              if (onGoingKill) {
                  return;
              }

              onGoingKill = true;

              zombieToKill.zombie.loadTexture('zombieDie', 0);
              zombieToKill.zombie.animations.add('die');
              zombieToKill.zombie.animations.play('die', 8, false);
              zombieToKill.zombie.animations.currentAnim.onComplete.add(function() {
                  killAZombie(zombieToKill);
                  onGoingKill = false;
              }, this);
            }


            /**
            @param zombieToKill -
            */
            function killAZombie(zombieToKill) {
                zombieToKill.animations.destroy();
                zombieToKill.killThisZombie();
                questionTextArea.html('');
                resumeAllPasuedZombies();
                typingMode(TypingEnum.off);

                if (zombieToKill == zombieWaitingForAnswer) {
                    zombieWaitingForAnswer = null;
                }

                if(hintText !== undefined
                        && hintText !== null) {
                    hintText.destroy();
                    hintText = null;
                }

                if (zombieCount >= MAX_ZOMBIE){
                    // move to next Stage, goto boss level

                    game.state.start('boss', true, false, PLAYER_CURRENT_HEALTH); // 傳過去player現在health
                }
            }

            /**
              * 殭屍叫聲還是由外部來load，要叫的時候再給進去。
              */
            function zombieGrrrrr(zomieToGrrr) {
              zomieToGrrr.Grrrrr(zombieGrrsArray);
            }

            function playerGetAttackByZombie(theZombieAttackingPlayer) {

              if (onGoingKill){
                  return;
              }
              // 殭屍叫
              zombieGrrrrr(theZombieAttackingPlayer);

              theZombieAttackingPlayer.zombie.loadTexture('zombieHit', 0);
              theZombieAttackingPlayer.zombie.animations.add('attack1', [0, 1, 2, 3]);
              theZombieAttackingPlayer.zombie.animations.play('attack1', 9, false);
              theZombieAttackingPlayer.zombie.animations.currentAnim.onComplete.add(function() {
                  theZombieAttackingPlayer.zombie.animations.add('attack2', [4, 5, 6]);
                  theZombieAttackingPlayer.zombie.animations.play('attack2', 4, false);
                  attackedEffect(theZombieAttackingPlayer);
              }, this);


            }

            function playerAttack(zombie) {
                if (onGoingKill){
                    return;
                }
                if (gunshot) {
                    gunshot.play();
                }
                // should zombie moan?
                zombieGrrrrr(zombie);

                zombie.zombie.loadTexture('zombieHit', 0);
                zombie.zombie.animations.add('attack1', [0, 1]);
                zombie.zombie.animations.play('attack1', 9, false);
                zombie.zombie.animations.currentAnim.onComplete.add(function() {
                    zombie.zombie.loadTexture('zombieIdle', 0);
                    zombie.zombie.animations.add('idle');
                    zombie.zombie.animations.play('idle', 6, true);
                }, this);
            }

            function attackedEffect(theZombieAttackingPlayer) {
              if (onGoingKill) {return; } // otherwise, the zombies will never die

              theZombieAttackingPlayer.zombie.loadTexture('zombieIdle', 0);
              theZombieAttackingPlayer.zombie.animations.play('idle', 6, true);
              PLAYER_CURRENT_HEALTH -= ZOMBIE_HIT_POINT;

              if (PLAYER_CURRENT_HEALTH <= 0){
                  isPlayerDead = true;
                  onGoingKill = true; // disable all animations
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
                        if (!isAnyZombieWaitingForAnswer()) { return; }
                        console.log('dialog mode on and key pressed: ' + char + 'in ascii number:' + char.charCodeAt());
                        var zombie = zombieWaitingForAnswer;
                        var moreDialogs = zombie.nextDialog();

                        if (moreDialogs < 0) {

                            if ( currentState == StateEnum.introductionBegin ) {
                                // kill the intruction guy
                                killAZombie(zombie);
                                currentState = StateEnum.introductionEnd;
                            }

                        }
                    });
                } else if (typingEnum == TypingEnum.answer) {
                    // typing mode on
                    game.input.keyboard.addCallbacks(this, null, null, function(char) {
                            if (!isAnyZombieWaitingForAnswer()) { return; }
                            if (onGoingKill) {return; } // otherwise, the zombies will never die
                            // don't forget ESC key down event is almost registed
                            // backspace key is prevented from browser capture at the top.
                            console.log('typing mode on and key pressed: ' + char + 'in ascii number:' + char.charCodeAt());
                            switch(char.charCodeAt()) {
                                case 0:
                                case 13:
                                    // enter key
                                    // 比較時抽掉空格 作弊的比較方式  eg: substring(0, 11) 跟 substring(0,11)
                                var playerAnswer = zombieWaitingForAnswer.ansTypeArea.text.replace(' ', '');
                                var correctAnswer = zombieWaitingForAnswer.getShortQuizAnswer().replace(' ', '');
                                if(checkAnswer(zombieWaitingForAnswer, playerAnswer, correctAnswer)) {
                                  playerAttack(zombieWaitingForAnswer);
                                  // zombie die!
                                  killAZombieWithAnimation(zombieWaitingForAnswer);
                                } else {
                                   if(checkAnswer(zombieWaitingForAnswer, playerAnswer, '[a,b]=[b,a]')) {
                                       // this question is tricky
                                       // player will need some help
                                      zombieWaitingForAnswer.showDialog();
                                      zombieWaitingForAnswer.say("Don't forget \nthe semicolon!");
                                      zombieWaitingForAnswer.dialogArea.y -= 100.0;
                                      zombieWaitingForAnswer.dialogArea.x += 20.0;
                                   }
                                  // player damaged
                                  clearZombieAnsTypeArea(zombieWaitingForAnswer);
                                  if(zombieWaitingForAnswer.isAbleToEsc === false) {
                                    playerGetAttackByZombie(zombieWaitingForAnswer);
                                  }

                                }
                                break;
                            default:
                                playerAttack(zombieWaitingForAnswer);

                                var ans = zombieWaitingForAnswer.ansTypeArea.text + char;
                                zombieWaitingForAnswer.setAnsText(ans);
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
                ans = ans.replace(' ', '');  // substring(0, 11) still equals to substring(0,11)  (no space)
                correctAnswer = correctAnswer.replace(' ', '');
                return (ans === correctAnswer);
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

            function shuffle(array) {
                var counter = array.length;

                // While there are elements in the array
                while (counter > 0) {
                    // Pick a random index
                    var index = Math.floor(Math.random() * counter);

                    // Decrease counter by 1
                    counter--;

                    // And swap the last element with it
                    var temp = array[counter];
                    array[counter] = array[index];
                    array[index] = temp;
                }

                return array;
            }

        }; // var func

        return func;
    }; //var battle

    return {
        battle: battle,
    };
});
