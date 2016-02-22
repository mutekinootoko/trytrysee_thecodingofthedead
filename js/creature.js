/**
 *  creature object responsible for
 *
 *  1. init
 *  2. hilight
 *  3. de-light
 *  4. enter typing mode
 *  5. leave typing mode
 */
define([], function(){
var MovingStyle = {"scale":1, "static":2};

//殭屍答案打字區 prefix
var ZOMBIE_ANSWER_TYPING_AEAR_PREFIX = "Ans:　";

//boot場景，用來做一些遊戲啟動前的準備
var zombieInit = function(game){
var zombieFunc = function(zombie) {

    var ansAreaBackgroundColor =  '#000000';

    zombie.inputEnabled = true;
    zombie.tint = 0xFFFFFF;
    zombie.movingStyle = MovingStyle.scale;

    //zombie.events.onInputDown.add(zombieClick, this);
    //zombie.events.onInputOver.add(zombieMouseHover, this);
    //zombie.events.onInputOut.add(zombieMouseHoverOut, this);

    var dialogArea = game.make.text(0,
                                     -zombie.height*zombie.anchor.y + 0.3*zombie.height,
                                     "",
                                     { font: "22px Arial",
                                        fill: "#FFFFFF",
                                        wordWrap: true,
                                        align: "left",
                                        //backgroundColor: "#1C1C1C"
                                     });
    dialogArea.anchor.set(0.4, 1.0);
    dialogArea.wordWrapWidth = 300.0;

    var ansTextArea = game.make.text(0,
                                     0,
                                     "function hello() {\n    return('_____');        \n}",
                                     { font: "22px Arial",
                                       fill: "#40FF00",
                                       wordWrap: false,
                                       align: "left",
                                       backgroundColor: ansAreaBackgroundColor
                                     });
    ansTextArea.anchor.set(0.5, 0.5);

    var timeCountdownArea = game.make.text(ansTextArea.left, 50,
                                              "",
                                              { font: "15px Arial",
                                                fill: "#FFFFFF",
                                                wordWrap: false,
                                                align: "left",
                                                backgroundColor: "#1C1C1C"
                                              });
    //timeCountdownArea.anchor.set(0.5, 0.5);
    var ansTypeArea = game.make.text(timeCountdownArea.right + 22, 50,
                                     ZOMBIE_ANSWER_TYPING_AEAR_PREFIX,
                                     { font: "22px Arial",
                                       fill: "#F7FE2E",
                                       wordWrap: false,
                                       align: "left",
                                       backgroundColor: ansAreaBackgroundColor
                                     });
    //ansTypeArea.anchor.set(0.5, 0.5);
    // hide all dialogs
    ansTypeArea.alpha = 0.0;
    ansTextArea.alpha = 0.0;
    dialogArea.alpha = 0.0;
    timeCountdownArea.alpha = 0;
    zombie.addChild(ansTextArea);
    zombie.addChild(ansTypeArea)
    zombie.addChild(dialogArea)
    zombie.addChild(timeCountdownArea);
    zombie.ansTextArea = ansTextArea;
    zombie.ansTypeArea = ansTypeArea;
    zombie.dialogArea = dialogArea;
    zombie.timeCountdownArea = timeCountdownArea;

    zombie.ansTypeArea.x = zombie.ansTextArea.left;
    zombie.ansTypeArea.y = zombie.ansTextArea.bottom;

    updateTextArea(zombie);
    zombie.textArea.alpha = 0.0;
    // zombie's short quiz
    zombie.shortQuiz // ShortQuiz object

    // signal區
    zombie.onAttackSignal = new Phaser.Signal();
    zombie.onDeathSignal = new Phaser.Signal(); // signal before zombie is killed

    /**
      * reset all variables and events
      */
    zombie.refreshingUp =  function() {
      zombie.onAttackSignal.removeAll();
      zombie.onDeathSignal.removeAll();
      zombie.ansTypeArea.alpha = 0.0;
      zombie.ansTextArea.alpha = 0.0;
      zombie.textArea.alpha = 0.0;
      zombie.dialogArea.alpha = 0.0;
      zombie.timeCountdownArea.alpha = 0;
    }

    /**
      *  reset all variables and events , then kill
      */
    zombie.killThisZombie = function () {
      zombie.refreshingUp();
      zombie.onDeathSignal.dispatch(this);
      zombie.kill();
    }

    zombie.setAnsText = function (text){
        var oldText = zombie.ansTypeArea.text;
        zombie.ansTypeArea.text = text;

        if (zombie.ansTypeArea.width > zombie.ansTextArea.width){
            zombie.ansTypeArea.text = oldText;
        }
        zombie.updateAnsText();
    }

    zombie.clearAnsText = function (){
       zombie.ansTypeArea.text = ZOMBIE_ANSWER_TYPING_AEAR_PREFIX;
       zombie.updateTextArea();
    }

    zombie.updateAnsText = function () {
      zombie.ansTypeArea.x = zombie.ansTextArea.left;
      zombie.ansTypeArea.y = zombie.ansTextArea.bottom;
      zombie.updateTextArea();
    }

    /**
      *  @param shortQuiz : ShortQuiz -
      */
    zombie.setShortQuiz = function (shortQuiz) {
      zombie.shortQuiz = shortQuiz;
      zombie.ansTextArea.text = shortQuiz.quizAnswerWithBlankToFill;
      zombie.ansTypeArea.x = zombie.ansTextArea.left;
      zombie.ansTypeArea.y = zombie.ansTextArea.bottom;
      zombie.updateTextArea();
    }

    zombie.getShortQuizAnswer = function() {
      if(zombie.shortQuiz === undefined
          || zombie.shortQuiz === null) {

        return '';
      }
      return zombie.shortQuiz.answer;
    }

    zombie.getShortQuizQuestionDescription = function () {
      if(zombie.shortQuiz === undefined
          || zombie.shortQuiz === null) {

        return '';
      }
      return zombie.shortQuiz.quizDescription;
    }

    zombie.startCountdown = function(secToCount) {
      //console.log('lala');
      if(secToCount < 2) {
        secToCount = 2;
      }
      var countingSec = secToCount;
      zombie.timeCountdownArea.alpha = 0.0; // don't show timeCountDown, it's annoying
      zombie.timeCountdownArea.text = countingSec-- + '';
      var countdownLoop = game.time.events.loop(Phaser.Timer.SECOND, function() {
        zombie.timeCountdownArea.text = countingSec  + '';
        if(countingSec === 0) {
          zombie.onAttackSignal.dispatch(zombie);
          countingSec = secToCount;
        } else {
          countingSec--;
        }
      }, this);
    }

    zombie.Grrrrr = function (audioGrrrArray) {
      var foobar = game.rnd.integerInRange(0, audioGrrrArray.length - 1);
      var zg = audioGrrrArray[foobar];
      if(zg !== undefined && zg !== null) {
        // just in case
        zg.play();
      }
    }

    zombie.say = function (str) {
        if (str) {
            var dialogArea = zombie.dialogArea;
            dialogArea.text = str;
            dialogArea.x = -dialogArea.width + 10;

            // make sure the left edge of dialog doesn't go outside of the left screen
            var dialogLeft = zombie.x + dialogArea.left;
            if (dialogArea.left < 10.0) {
                dialogArea.x += (10.0 - dialogLeft);
                dialogArea.left = 30.0;
            }
        }
    }

    zombie.nextDialog = function () {
        if (zombie.dialogs) {
            if (!zombie.nextDialogLine) {
                zombie.nextDialogLine = 0;
            }

            if (zombie.nextDialogLine < zombie.dialogs.length) {
                var dialogArea = zombie.dialogArea;
                dialogArea.text = zombie.dialogs[zombie.nextDialogLine];
                dialogArea.x = - dialogArea.width + 10;
                zombie.nextDialogLine += 1;

            } else {
                return -1;
            }

            return zombie.nextDialogLine;

        } else {
            return -1; // no more dialogs
        }

        return -1;
    }
    zombie.showDialog = function() {
        var zombieToHilight = zombie;

        // show answer area
        zombieToHilight.dialogArea.alpha = 1.0;
    };

    zombie.hilight = function() {
        var zombieToHilight = zombie;
        zombieToHilight.tint = 0xFE2E2E;

        // show answer area
        zombieToHilight.ansTypeArea.alpha = 1.0;
        zombieToHilight.ansTextArea.alpha = 1.0;
        zombieToHilight.textArea.alpha = 1.0;
        //zombieToHilight.dialogArea.alpha = 1.0;
    };

    zombie.lolight = function() {
        var zombieToHilight = zombie;
        zombieToHilight.tint = 0xFFFFFF;

        // show answer area
        zombieToHilight.ansTypeArea.alpha = 0.0;
        zombieToHilight.ansTextArea.alpha = 0.0;
        zombieToHilight.textArea.alpha = 0.0;
        //zombieToHilight.dialogArea.alpha = 1.0;
    };

    zombie.updateTextArea = function(){
        updateTextArea(zombie);
    }

    function updateTextArea(aZombie){
        var ansTypeArea = aZombie.ansTypeArea;
        var ansTextArea = aZombie.ansTextArea;
        var sprite = makeRectangle(ansTextArea.width, ansTypeArea.height+ansTextArea.height);

        var oldAlpha = 1.0;
        if (aZombie.textArea) {
            oldAlpha = aZombie.textArea.alpha; // preserve alpha setting
            aZombie.textArea.destroy();
        }

        if (sprite) {
            sprite.anchor.set(0.5);
            sprite.left = ansTextArea.left;
            sprite.top = ansTextArea.top;
            sprite.y += 10.0; // why?
            aZombie.addChild(sprite)
            aZombie.removeChild(ansTypeArea)
            aZombie.removeChild(ansTextArea)
            aZombie.addChild(ansTypeArea)
            aZombie.addChild(ansTextArea)
            aZombie.textArea = sprite;
            aZombie.textArea.alpha = oldAlpha;
        }


    }
    function makeRectangle(width, height){
        width += 20.0;
        height += 20.0;
        var stroke = 2.0;
        var bmd = game.make.bitmapData(width, height);

        bmd.ctx.beginPath();
        bmd.ctx.rect(0, 0, width, height);
        bmd.ctx.fillStyle = '#40FF00';
        bmd.ctx.fill();
        bmd.ctx.closePath();
        bmd.ctx.beginPath();
        bmd.ctx.rect(stroke, stroke, width-2*stroke, height-2*stroke);
        bmd.ctx.fillStyle = ansAreaBackgroundColor;
        bmd.ctx.fill();
        bmd.ctx.closePath();

        sprite = game.make.sprite(0, 0, bmd);
        return sprite;
    }

    //zombie.de_hilightAllZombie = function() {
        //zombie.tint = 0xFFFFFF;
    //};


    /**
     * isAbleToEsc : bool - 是否能逃離（按esc逃離，如果是殭屍遇上player就不能逃）
     */
    //function zombieIsDemandingForAnswer(zombieNeedAnswer, secToWait, isAbleToEsc) {
        //zombieNeedAnswer.zIndexBeforeClicked = zombieNeedAnswer.z;
        //zombieGroup.bringToTop(zombieNeedAnswer);
        //if(isDebug) {
            //console.log("zombie was on " + zombieNeedAnswer.zIndexBeforeClicked + ", and moved to front at " + zombieNeedAnswer.z);
        //}
        //zombieWaitingForAnswer = zombieNeedAnswer;
        //zombieWaitingForAnswer.isAbleToEsc = isAbleToEsc;
        //hilightZombie(zombieWaitingForAnswer);
        //pauseAllAliveZombies();
        //typingMode(true);
    //}

    /*
    function zombieMouseHover(zombieHoverOn, point) {
        if(isAnyZombieWaitingForAnswer() === false) {
            hilightZombie(zombieHoverOn);
        }
    }
    */

    //function zombieMouseHoverOut(zombieHoverThenOut, point) {
        //if(isAnyZombieWaitingForAnswer()) {
            //hilightZombie(zombieWaitingForAnswer);
        //} else {
            //de_hilightAllZombie();
        //}

    //}

    /**
     * 點下殭屍，就暫停所有殭屍動作，點下的殭屍進入等待答案模式。
     * 要按esc才會跳離開等待答案模式。
     */
    //function zombieClick(clickedZombie, point) {
        //if(isAnyZombieWaitingForAnswer()) {
            //return;
        //}

        //if(isDebug) {
            //console.log("zombie clicked at:" + zombieGroup.getIndex(clickedZombie));
        //}

        //zombieIsDemandingForAnswer(clickedZombie, ZOMBIE_SEC_TO_WAIT_FOR_ANSWER, true);
        //hintText = game.add.text(1, 50,
                //"Press ESC to quit answer.",
                //{ font: "20px Arial", fill: "#FFFFFF", });
    //}

    return zombie;
}   // zombieFunc
    return zombieFunc;
}   // zombie
    return {
        zombieInit: zombieInit,
        movingStyle: MovingStyle,
        ansPrefix: ZOMBIE_ANSWER_TYPING_AEAR_PREFIX
    };
}); // define
