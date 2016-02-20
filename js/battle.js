/**
 *  handle boot screen
 *
 */


define([], function(){

    //boot場景，用來做一些遊戲啟動前的準備
    var battle = function(game){
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
            var ZOMBIE_MEET_PLAYER_SCALE = 2;
            //殭屍等待答案時間
            var ZOMBIE_SEC_TO_WAIT_FOR_ANSWER = 30;
            //殭屍答案打字區 prefix
            var ZOMBIE_ANSWER_TYPING_AEAR_PREFIX = "Ans:";
            // 可調參數 end ************************************


            var zombieGroup;
            var ZOMBIE_APPEARING_POSITISION_IN_X_POINT_FROM;
            var ZOMBIE_APPEARING_POSITISION_IN_X_POINT_TO;
            var ZOMBIE_APPEARING_POSITISION_IN_X_POINT_CENTER;
            var isAllZombiePaused;
            var isDebug;
            var zombieWaitingForAnswer; // 被點到，或是碰到player的殭屍
            var hintText; // 左上角的text sprite

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
                game.load.image('zombie', 'zombie.gif');
                //game.load.image('zombie', 'zombie2.jpg');
                game.load.image('gameBg', 'gameBg.png');
            };

            this.create = function(){

                game.physics.startSystem(Phaser.Physics.ARCADE);
                game.add.tileSprite(-250, -150, 1250, 950, 'gameBg');


                // pre-calculation
                ZOMBIE_APPEARING_POSITISION_IN_X_POINT_FROM = Math.floor(game.world.width * ZOMBIE_APPEARING_POSITISION_IN_X_PERCENTAGE_FROM);
                ZOMBIE_APPEARING_POSITISION_IN_X_POINT_TO = Math.floor(game.world.width * ZOMBIE_APPEARING_POSITISION_IN_X_PERCENTAGE_TO);
                ZOMBIE_APPEARING_POSITISION_IN_X_POINT_CENTER = (ZOMBIE_APPEARING_POSITISION_IN_X_POINT_TO - ZOMBIE_APPEARING_POSITISION_IN_X_POINT_FROM) /2;

                zombieGroup = game.add.group();
                zombieGroup.enableBody = true;
                zombieGroup.createMultiple(10, 'zombie');
                zombieGroup.setAll('anchor.x', 0);
                zombieGroup.setAll('anchor.y', 0);
                zombieGroup.setAll('outOfBoundsKill', true);

                isAllZombiePaused = false;
                isDebug = getUrlVars()['debug'] === "1";

                game.time.events.loop(Phaser.Timer.SECOND * 2, zombieRising, this);
                //zombieRising();
                //
                var keyEsc = game.input.keyboard.addKey(Phaser.Keyboard.ESC);
                keyEsc.onDown.add(pressEsc, this);
            };

            this.update = function() {

                if(isAllZombiePaused === false) {
                    zombieGroup.forEachAlive(function(zombie) {
                        var newscale = zombie.y * ZOMBIE_SCALE_INCREASING_RATE;
                        if(newscale >= ZOMBIE_INIT_SCALE) {
                            zombie.scale.x = newscale;
                            zombie.scale.y = newscale;
                        }


                        if(zombie.scale.x > ZOMBIE_MEET_PLAYER_SCALE) {
                            // meet the player
                            //zombie.kill();
                            zombieIsDemandingForAnswer(zombie, ZOMBIE_SEC_TO_WAIT_FOR_ANSWER, false);
                        }

                    }, this);
                }
            }


            this.render = function() {

                if(isDebug) {
                    var foo = zombieGroup.getFirstAlive();
                    if(foo !== undefined && foo !== null) {
                        game.debug.bodyInfo(foo, 20, 32);
                    }
                }
            }

            function zombieRising() {
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
                                                  zombie.inputEnabled = true;
                                                  zombie.tint = 0xFFFFFF;
                                                  zombie.events.onInputDown.add(zombieClick, this);
                                                  zombie.events.onInputOver.add(zombieMouseHover, this);
                                                  zombie.events.onInputOut.add(zombieMouseHoverOut, this);

                                                  var ansTextArea = game.make.text(0,
                                                                                   100,
                                                                                   "System.out.println('_____');\nJUST TYPE HelloWorld",
                                                                                   { font: "15px Arial",
                                                                                       fill: "#40FF00",
                                                                                       wordWrap: false,
                                                                                       align: "left",
                                                                                       backgroundColor: "#1C1C1C"
                                                                                   });
                                                  var ansTypeArea = game.make.text(0, 150,
                                                                                   ZOMBIE_ANSWER_TYPING_AEAR_PREFIX,
                                                                                   { font: "15px Arial",
                                                                                       fill: "#F7FE2E",
                                                                                       wordWrap: false,
                                                                                       align: "center",
                                                                                       backgroundColor: "#1C1C1C"
                                                                                   });
                                                  ansTypeArea.alpha = 0.0;
                                                  ansTextArea.alpha = 0.0;
                                                  zombie.addChild(ansTextArea);
                                                  zombie.addChild(ansTypeArea)
                                                  zombie.ansTextArea = ansTextArea;
                                                  zombie.ansTypeArea = ansTypeArea;

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
                }, this);

            }

            function resumeAllPasuedZombies() {
                zombieGroup.forEachAlive(function(zombie_foo) {
                    zombie_foo.body.enable = true;
                }, this);

                isAllZombiePaused = false;
            }

            function de_hilightAllZombie() {
                zombieGroup.setAll('tint', 0xFFFFFF);
            }

            function hilightZombie(zombieToHilight) {
                de_hilightAllZombie();
                zombieToHilight.tint = 0xFE2E2E;

                // show answer area
                zombieToHilight.ansTypeArea.alpha = 1.0;
                zombieToHilight.ansTextArea.alpha = 1.0;

            }

            function zombieMouseHover(zombieHoverOn, point) {
                if(isAnyZombieWaitingForAnswer() === false) {
                    hilightZombie(zombieHoverOn);
                }
            }

            function zombieMouseHoverOut(zombieHoverThenOut, point) {
                if(isAnyZombieWaitingForAnswer()) {
                    hilightZombie(zombieWaitingForAnswer);
                } else {
                    de_hilightAllZombie();
                }

            }

            /**
             * 點下殭屍，就暫停所有殭屍動作，點下的殭屍進入等待答案模式。
             * 要按esc才會跳離開等待答案模式。
             */
            function zombieClick(clickedZombie, point) {
                if(isAnyZombieWaitingForAnswer()) {
                    return;
                }

                if(isDebug) {
                    console.log("zombie clicked at:" + zombieGroup.getIndex(clickedZombie));
                }

                zombieIsDemandingForAnswer(clickedZombie, ZOMBIE_SEC_TO_WAIT_FOR_ANSWER, true);
                hintText = game.add.text(1, 1,
                        "Press ESC to quit answer.",
                        { font: "20px Arial", fill: "#FFFFFF", });
            }

            /**
             * 殭屍取消作答（或是時間到停止作答）
             */
            function zombieCancelWaiting() {
                clearZombieAnsTypeArea(zombieWaitingForAnswer);
                zombieWaitingForAnswer.parent.setChildIndex(zombieWaitingForAnswer, zombieWaitingForAnswer.zIndexBeforeClicked);
                zombieWaitingForAnswer = null;
                resumeAllPasuedZombies();
                typingMode(false);
            }

            /**
             * isAbleToEsc : bool - 是否能逃離（按esc逃離，如果是殭屍遇上player就不能逃）
             */
            function zombieIsDemandingForAnswer(zombieNeedAnswer, secToWait, isAbleToEsc) {
                zombieNeedAnswer.zIndexBeforeClicked = zombieNeedAnswer.z;
                zombieGroup.bringToTop(zombieNeedAnswer);
                if(isDebug) {
                    console.log("zombie was on " + zombieNeedAnswer.zIndexBeforeClicked + ", and moved to front at " + zombieNeedAnswer.z);
                }
                zombieWaitingForAnswer = zombieNeedAnswer;
                zombieWaitingForAnswer.isAbleToEsc = isAbleToEsc;
                hilightZombie(zombieWaitingForAnswer);
                pauseAllAliveZombies();
                typingMode(true);
            }

            function killAZombie(zombieToKill) {
                zombieWaitingForAnswer.kill();
                zombieWaitingForAnswer = null;
                resumeAllPasuedZombies();
                typingMode(false);
                if(hintText !== undefined
                        && hintText !== null) {
                    hintText.destroy();
                    hintText = null;
                }
            }

            function typingMode(isOn) {
                if(isOn) {
                    // typing mode on
                    game.input.keyboard.addCallbacks(this, null, null, function(char) {
                            // don't forget ESC key down event is almost registed
                            // backspace key is prevented from browser capture at the top.
                            console.log('typing mode on and key pressed: ' + char + 'in ascii number:' + char.charCodeAt());
                            switch(char.charCodeAt()) {
                                case 0:
                                    // enter key
                                if(checkAnswer(zombieWaitingForAnswer, zombieWaitingForAnswer.ansTypeArea.text, 'HelloWorld')) {
                                // zombie die!
                                killAZombie(zombieWaitingForAnswer);
                                } else {
                                // play damaged
                                clearZombieAnsTypeArea(zombieWaitingForAnswer);
                                // TODO
                                }
                                break;
                            default:
                                zombieWaitingForAnswer.ansTypeArea.text += char;
                                break;
                                }
                                });
                } else {
                    game.input.keyboard.clearCaptures(); // this won't clear 'ESC' and 'backspace' registed somewhere else
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

            return this;
        }; // var func

        return func;
    }; //var battle

    return {
        battle: battle,
    };
});


