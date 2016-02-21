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
                    'Reverse a string.',
                    ['"abc"'],
                    '"cbd"',
                    'function stringReverse(s){\n\t//code here\n\t//return s.split("").reverse().join("");\n\treturn "";\n}',
                    'stringReverse');
                this.questions.push(q1);

                var q2 = new CodeQuestion.CodeQuestion(
                    1, 
                    'Write a program that returns all prime numbers between X(min) and Y(max) in an array in ascending order. eg: [2, 3, 5...]',
                    [2, 20],
                    [2, 3, 5, 7, 11, 13, 17, 19],
                    'function findPrimeNumbersBetween(x, y){\n\t//code here\n\t/*var sieve = [], i, j, primes = [];\n\tfor (i = x; i <= y; ++i) {\n\t\tif (!sieve[i]) {\n\t\t\tprimes.push(i);\n\t\t\tfor (j = i << 1; j <= y; j += i) {\n\t\t\t\tsieve[j] = true;\n\t\t\t}\n\t\t}\n\t}\n\treturn primes;*/\n\treturn [];\n}',
                    'findPrimeNumbersBetween');
                this.questions.push(q2);

                var q3 = new CodeQuestion.CodeQuestion(
                    2, 
                    'Convert integers into roman numerals.',
                    [512],
                    '"DXII"',
                    'function romanize (num) {\n\t//code here\n\t/*var digits = String(+num).split(""),\n\t\tkey = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM","","X","XX","XXX","XL","L","LX","LXX","LXXX","XC","","I","II","III","IV","V","VI","VII","VIII","IX"],\n\t\troman = "",\n\t\ti = 3;\n\twhile (i--)\n\t\troman = (key[+digits.pop() + (i * 10)] || "") + roman;\n\treturn Array(+digits.join("") + 1).join("M") + roman;*/\n\treturn "";\n}',
                    'romanize');
                this.questions.push(q3);


                var q4 = new CodeQuestion.CodeQuestion(
                    3, 
                    'Reverse a string.',
                    ['2000'],
                    true,
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