define(function(){


    /**
    * @param {int} qid 
    * @param {string} question
    * @param {array} array of input arguments. if input is string, must wrap again with double qoute. eg: var s = '"s"';  
    * @param {any} expectedOutput
    * @param {string} codeTemplate
    * @param {string} functionName 
    */
    function CodeQuestion(qid, question, theinputArray, expectedOutput, codeTemplate, functionName) {

        this.qid = qid;
        this.question = question;
        this.theinputArray = theinputArray;
        this.expectedOutput = expectedOutput;
        this.codeTemplate = codeTemplate;
        this.functionName = functionName;
    }


    /**
     * @return {string}  functionName(input1, input2, input3...)
     */
    CodeQuestion.prototype.getFunctionCallString = function() {
        var argumentsString = '';
        for(var i = 0; i < this.theinputArray.length; i++) {
            argumentsString += this.theinputArray[i];
            if(i < this.theinputArray.length - 1) {
                argumentsString += ', ';
            }
        }
        return this.functionName + '(' + this.theinputArray.join(',') + ')';
    }

    return {
        CodeQuestion : CodeQuestion,
    }
});
