import { ROLE_QUIZZES, type QuizQuestion } from "../../../shared/quiz";

export * from "../../../shared/quiz";

export function calculateQuizScore(role: string, answers: Record<string, number>): number {
  const quiz = ROLE_QUIZZES[role] || [];
  if (quiz.length === 0) return 0;

  let correct = 0;
  quiz.forEach((q: QuizQuestion) => {
    if (answers[q.id] === q.correctAnswer) {
      correct++;
    }
  });

  return Math.round((correct / quiz.length) * 100);
}
