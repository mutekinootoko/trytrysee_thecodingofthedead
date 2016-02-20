/**
 *  represent the game it self
 *
 *  the flow:
 *  1. generate the session id
 *  2. check the cookie to load the game progress
 *  3. if exists, continue from previous game
 *  4. if not, begin from level 1
 *  5. randomly select questions
 *  6. verify the user input when user fills the text box
 *  7. if correct, move to next zombie. Show "you are hired" when the zombie load is dead
 *  8. if not, show attack animation
 *  9. if health is zero, show you failed messages
 *
 */


define([], function(){

    var getUrlParameter = function getUrlParameter(sParam) {
        var sPageURL = decodeURIComponent(window.location.search.substring(1)),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? null : sParameterName[1];
            }
        }
    };

    var getSessionId = function getSessionId(){
        var sessionId = getUrlParameter("session");
        return sessionId;
    }

    var PlayGround = function PlayGround(questionBlock){
        // get environment variable

        this.currentQuestion = 'Question 1: <br><br>&emsp;  write a function that returns "hello world"';
        questionBlock.html(this.currentQuestion);
    };

    PlayGround.prototype.setQuestion = function (questionText, codequestion) {
        questionText.html(codequestion.question);
        this.player.editor.setValue(codequestion.codeTemplate, -1);
    }

    // reset the content of playground to initial value
    PlayGround.prototype.reset = function () {
        this.setQuestion(this.questionText, this.currentQuestion);
    }

    PlayGround.prototype.showLose = function () {
        swal({
          title: "Game Finished",
          text: "You Lose:(",
          type: "info",
          confirmButtonText: "OK",
          cancelButtonText: "Cancel",
          closeOnCancel: true,
        }, function(isConfirm) {
        });
    }

    return {
        PlayGround: PlayGround,
    };
});

