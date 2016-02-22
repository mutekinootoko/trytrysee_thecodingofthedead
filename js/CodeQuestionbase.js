define(['CodeQuestion'],
    function(CodeQuestion){

        var instance = null;

        function CodeQuestionbase(){
            if(instance !== null){
                throw new Error("Cannot instantiate more than one CodeQuestionbase, use CodeQuestionbase.getInstance()");
            }

            this.initialize();
        }

        CodeQuestionbase.prototype = {
            initialize: function(){
                // summary:
                //      Initializes the singleton.

                this.counter = 0;


                // define Questions here
                this.questions = [];

                // !!!! use " to quote to represent a string in string for input and output.
                // eg: '"imstring"'

                var q1 = new CodeQuestion.CodeQuestion(
                    0,
                    "Reverse a string.<BR><BR>Example: an output for 'pear' would be 'raep'.<BR><BR>[input] string<BR><BR>[output] string",
                    ['"abc"'],
                    "'cba'",
                    'function stringReverse(s){\n\t//code here\n\t//return s.split("").reverse().join("");\n\treturn "";\n}',
                    'stringReverse');
                this.questions.push(q1);

                var q3 = new CodeQuestion.CodeQuestion(
                    2,
                    "Convert integers into roman numerals.<BR><BR>Example: <BR>an output for 126 would be 'CXXVI'.<BR>an output for 623 would be 'DCXXIII'<BR><BR>[input] integer n<BR><BR>[output] string",
                    [512],
                    "'DXII'",
                    'function romanize (num) {\n\t//code here\n\t/*var digits = String(+num).split(""),\n\t\tkey = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM","","X","XX","XXX","XL","L","LX","LXX","LXXX","XC","","I","II","III","IV","V","VI","VII","VIII","IX"],\n\t\troman = "",\n\t\ti = 3;\n\twhile (i--)\n\t\troman = (key[+digits.pop() + (i * 10)] || "") + roman;\n\treturn Array(+digits.join("") + 1).join("M") + roman;*/\n\treturn "";\n}',
                    'romanize');
                this.questions.push(q3);


                var q4 = new CodeQuestion.CodeQuestion(
                    3,
                    "Check for leap year.<BR><BR>Example: <BR>an output for 2016 would be true.<BR>an output for 2017 would be false.<BR><BR>[input] integer n<BR><BR>[output] boolean",
                    ['2000'],
                    'true',
                    'function isLeap (yr) {\n\t/*if (yr > 1582) return !((yr % 4) || (!(yr % 100) && (yr % 400)));\n\tif (yr >= 0) return !(yr % 4);\n\tif (yr >= -45) return !((yr + 1) % 4);\n\treturn false;*/\n\treturn false;\n}',
                    'isLeap');
                this.questions.push(q4);
            }
        };

        /**
        * randomly pick a question
        * @return {CodeQuestion}
        */
        CodeQuestionbase.prototype.pickQuestion = function () {
            return this.questions[Math.floor(Math.random() * this.questions.length)];

        };

        CodeQuestionbase.getInstance = function(){
            // summary:
            //      Gets an instance of the singleton. It is better to use
            if(instance === null){
                instance = new CodeQuestionbase();
            }
            return instance;
        };

        return CodeQuestionbase.getInstance();
});
