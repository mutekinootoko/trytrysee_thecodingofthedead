/**
 * 短問題
 */


define([], function(){


  var ShortQuiz = function ShortQuiz(quizDescription, quizAnswerWithBlankToFill, answer) {
    this.quizDescription = quizDescription; //問題敘述
    this.quizAnswerWithBlankToFill = quizAnswerWithBlankToFill; //問題 有要填空的code eg: printf("______");
    this.answer = answer; // 答案
  }

  return {
      ShortQuiz: ShortQuiz,
  };
});
