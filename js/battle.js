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

            //殭屍一開始的大小
            var ZOMBIE_INIT_SCALE = 0.3;
            // 殭屍"往前走"放大比例速度
            var ZOMBIE_SCALE_INCREASING_RATE = 0.02;
            // 殭屍碰到player的放大倍數
            var ZOMBIE_MEET_PLAYER_SCALE = 1.5;
            //殭屍等待答案時間
            var ZOMBIE_SEC_TO_WAIT_FOR_ANSWER = 10;
            //殭屍答案打字區 prefix
            var ZOMBIE_ANSWER_TYPING_AEAR_PREFIX = "Ans:";
            //血格總數量
            var PLAYER_NUMBER_OF_HEALTH_BARS = 10;
            // 殭屍攻擊點數
            var ZOMBIE_HIT_POINT = 10;
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
            var bgMusic; // 背景音樂
            var zombieGrrsArray = []; //Array<audio> 殭屍叫聲, 這個不要放creature裡 @see zombieGrrrrr()

            var StateEnum = {"introductionBegin":1, "introductionEnd":2, "firstZombieBegin":3, "firstZombieEnd":4}
            var TypingEnum = {"off":0, "dialog":1, "answer":2}
            var currentState; // 目前的劇情進展

            var shortQuizCollection; //Array<ShortQuiz>


            // prevent backspace(delete) capture by firefox or chrome to 'go back'
            this.handleBackspace = function(e) {
                if (e.which === 8 && !$(e.target).is("input, textarea")) {
                  e.preventDefault();

                  if(isAnyZombieWaitingForAnswer()) {
                    // keep 'Ans:'
                    if(zombieWaitingForAnswer.ansTypeArea.text.length > ZOMBIE_ANSWER_TYPING_AEAR_PREFIX.length) {
                      zombieWaitingForAnswer.ansTypeArea.text = zombieWaitingForAnswer.ansTypeArea.text.substring(0, zombieWaitingForAnswer.ansTypeArea.text.length -1)
                    }
                  }

                }
            };

            this.preload = function(){
                //game.load.image('zombie', 'zombie.gif');

                game.load.spritesheet('zombieGo', 'assets/zombieGo.png', 200, 312, 10);
                game.load.spritesheet('zombieIdle', 'assets/zombieIdle.png', 200, 308, 6);
                game.load.spritesheet('zombieHit', 'assets/zombieHit.png', 372, 324, 7);
                game.load.spritesheet('zombieDie', 'assets/zombieDie.png', 444, 292, 8);
                //game.load.image('zombie', 'zombie2.jpg');
                game.load.image('gameBg', 'assets/gameBg.jpg');

                // mp3 for chrome, ogg for firefox
                game.load.audio('bgmusic', ['assets/audio/backgroundMusic.mp3', 'assets/audio/backgroundMusic.ogg']);
                game.load.audio('zombieGrr1', ['assets/audio/zombie-1.mp3', 'assets/audio/zombie-1.ogg']);
                game.load.audio('zombieGrr4', ['assets/audio/zombie-4.mp3', 'assets/audio/zombie-4.ogg']);
                game.load.audio('zombieGrr10', ['assets/audio/zombie-10.mp3', 'assets/audio/zombie-10.ogg']);
                game.load.audio('zombieGrr11', ['assets/audio/zombie-11.mp3', 'assets/audio/zombie-11.ogg']);
                game.load.audio('zombieGrr15', ['assets/audio/zombie-15.mp3', 'assets/audio/zombie-15.ogg']);
            };

            this.create = function(){

                game.physics.startSystem(Phaser.Physics.ARCADE);
                game.add.tileSprite(-250, -150, 1250, 950, 'gameBg');

                // world邊界設定的比camera大一點，可以做搖晃效果
                game.world.setBounds(0, 0, game.world.width + 15, game.world.height);

                // Short quiz colleciton
                shortQuizCollection = [];
                shortQuizCollection.push(new ShortQuiz.ShortQuiz('Put first 10 digits of Pi in each element of an Array. <br/> eg: [ "3", "1", "4", "1", "5", "9", "2", "6", "5", "3" ] <br/><b>Hint: Math.PI.toString().substring(0, 11).replace(\'.\', \'\').split(\'\');</b>', 'Math.PI.toString().________\n.replace(\'.\', \'\').split(\'\');', 'substring(0,11)'));
                shortQuizCollection.push(new ShortQuiz.ShortQuiz('Insert an array in another array.<br/>  var a = [1,2,3,7,8,9];<br/>var b = [4,5,6]; <br/>var insertIndex = 3; <br/>Make a = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];  <br/><b>Hint: a.splice.apply(a, Array.concat(insertIndex, 0, b));</>', 'a.splice.apply( \na, Array._____(insertIndex, 0, b));', 'concat'));

                zombieGrrsArray.push(game.add.audio('zombieGrr1'));
                zombieGrrsArray.push(game.add.audio('zombieGrr4'));
                zombieGrrsArray.push(game.add.audio('zombieGrr10'));
                zombieGrrsArray.push(game.add.audio('zombieGrr11'));
                zombieGrrsArray.push(game.add.audio('zombieGrr15'));

                bgMusic = game.add.audio('bgmusic');
                bgMusic.play('', 0, 1, true);//loop

                // pre-calculation
                ZOMBIE_APPEARING_POSITISION_IN_X_POINT_FROM = Math.floor(game.world.width * ZOMBIE_APPEARING_POSITISION_IN_X_PERCENTAGE_FROM);
                ZOMBIE_APPEARING_POSITISION_IN_X_POINT_TO = Math.floor(game.world.width * ZOMBIE_APPEARING_POSITISION_IN_X_PERCENTAGE_TO);
                ZOMBIE_APPEARING_POSITISION_IN_X_POINT_CENTER = (ZOMBIE_APPEARING_POSITISION_IN_X_POINT_TO - ZOMBIE_APPEARING_POSITISION_IN_X_POINT_FROM) /2;

                zombieGroup = game.add.group();
                zombieGroup.enableBody = true;
                zombieGroup.createMultiple(10, 'zombieGo');
                zombieGroup.setAll('anchor.x', 0);
                zombieGroup.setAll('anchor.y', 0);
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
                game.time.events.loop(Phaser.Timer.SECOND * 2, zombieRising, this);
                //game.time.events.loop(Phaser.Timer.SECOND * 2, zombieRising, this);
            };

            this.update = function() {
                if(isAllZombiePaused === false) {
                    zombieGroup.forEachAlive(function(zombie) {

                        if (zombie.movingStyle == creature.movingStyle.scale){
                            var newscale = zombie.y * ZOMBIE_SCALE_INCREASING_RATE;
                            if(newscale >= ZOMBIE_INIT_SCALE) {
                                zombie.scale.x = newscale;
                                zombie.scale.y = newscale;
                            }
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
                // zombie appearing position x-axis
                var x  =  game.rnd.integerInRange(ZOMBIE_APPEARING_POSITISION_IN_X_POINT_FROM,
                                                  ZOMBIE_APPEARING_POSITISION_IN_X_POINT_TO);
                zombie.reset(x, 15);
                zombie.scale.setTo(ZOMBIE_INIT_SCALE,ZOMBIE_INIT_SCALE);
                zombieGroup.sendToBack(zombie);
                zombie.body.velocity.y = 20;
                zombie.body.acceleration.y = 1.5;
                zombie.body.velocity.x = game.rnd.integerInRange(10, 25);
                zombie.body.acceleration.x = game.rnd.realInRange(3.0, 4.6);
                if(x >= ZOMBIE_APPEARING_POSITISION_IN_X_POINT_CENTER) { //出現位置靠右邊的往左走
                    zombie.body.velocity.x = game.rnd.integerInRange(-10, -25);
                    zombie.body.acceleration.x = game.rnd.realInRange(-3, -4.2);
                }
                zombie.loadTexture('zombieGo', 0);
                zombie.animations.add('go');
                zombie.animations.play('go', 10, true);
                zombie = creature.zombieInit(game)(zombie);

                // 註冊zombieAttack事件（signal, just like NSNotificationCenter）
                zombie.onAttackSignal.add(playerGetAttackByZombie, this);
                // TODO 註冊zombieOnDeath 事件

                zombie.setShortQuiz( shortQuizCollection[game.rnd.integerInRange(0, shortQuizCollection.length - 1)]);

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
                    zombie_foo.loadTexture('zombieIdle', 0);
                    zombie_foo.animations.add('idle');
                    zombie_foo.animations.play('idle', 6, true);
                }, this);

            }

            function resumeAllPasuedZombies() {
                zombieGroup.forEachAlive(function(zombie_foo) {
                    zombie_foo.body.enable = true;
                    zombie_foo.loadTexture('zombieGo', 0);
                    zombie_foo.animations.add('go');
                    zombie_foo.animations.play('go', 10, true);
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

              zombieToKill.loadTexture('zombieDie', 0);
              zombieToKill.animations.add('die');
              zombieToKill.animations.play('die', 8, false);
              zombieToKill.animations.currentAnim.onComplete.add(function() {
                  killAZombie(zombieToKill);
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
            }

            /**
              * 殭屍叫聲還是由外部來load，要叫的時候再給進去。
              */
            function zombieGrrrrr(zomieToGrrr) {
              zomieToGrrr.Grrrrr(zombieGrrsArray);
            }

            function playerGetAttackByZombie(theZombieAttackingPlayer) {
              PLAYER_CURRENT_HEALTH -= ZOMBIE_HIT_POINT;
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
                            // don't forget ESC key down event is almost registed
                            // backspace key is prevented from browser capture at the top.
                            console.log('typing mode on and key pressed: ' + char + 'in ascii number:' + char.charCodeAt());
                            switch(char.charCodeAt()) {
                                case 0:
                                    // enter key
                                    // 比較時抽掉空格 作弊的比較方式  eg: substring(0, 11) 跟 substring(0,11)
                                if(checkAnswer(zombieWaitingForAnswer, zombieWaitingForAnswer.ansTypeArea.text.replace(' ', ''), zombieWaitingForAnswer.getShortQuizAnswer().replace(' ', ''))) {
                                  // zombie die!
                                  killAZombieWithAnimation(zombieWaitingForAnswer);
                                } else {
                                  // player damaged
                                  clearZombieAnsTypeArea(zombieWaitingForAnswer);
                                  if(zombieWaitingForAnswer.isAbleToEsc === false) {
                                    playerGetAttackByZombie(zombieWaitingForAnswer);
                                  }

                                }
                                break;
                            default:
                                zombieWaitingForAnswer.ansTypeArea.text += char;
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

            return this;
        }; // var func

        return func;
    }; //var battle

    return {
        battle: battle,
    };
});
