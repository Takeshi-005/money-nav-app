import type { QuizStats } from "../model/types";

export const PERFECT_DAY_MIN_QUIZZES = 3;

type AttemptLike = {
  quiz_date: string;
  is_correct: boolean;
};

export function calculateQuizStats(attempts: AttemptLike[]): QuizStats {
  const totalAttempts = attempts.length;
  const correctCount = attempts.filter((a) => a.is_correct).length;
  const accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;

  const dateResults = new Map<string, { correct: number; total: number }>();
  for (const attempt of attempts) {
    const result = dateResults.get(attempt.quiz_date) ?? {
      correct: 0,
      total: 0,
    };
    result.total += 1;
    if (attempt.is_correct) {
      result.correct += 1;
    }
    dateResults.set(attempt.quiz_date, result);
  }

  let perfectDays = 0;
  for (const result of dateResults.values()) {
    if (
      result.total >= PERFECT_DAY_MIN_QUIZZES &&
      result.correct === result.total
    ) {
      perfectDays += 1;
    }
  }

  const sortedDates = Array.from(dateResults.keys()).sort().reverse();
  let streakDays = 0;
  for (const date of sortedDates) {
    const result = dateResults.get(date)!;
    if (result.correct > 0) {
      streakDays += 1;
    } else {
      break;
    }
  }

  return {
    totalAttempts,
    correctCount,
    accuracy: Math.round(accuracy * 10) / 10,
    streakDays,
    perfectDays,
  };
}
