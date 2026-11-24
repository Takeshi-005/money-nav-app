export function isAllCorrect<T extends { quiz_type: string }>(
  quizzes: T[],
  resultsByType: Map<string, boolean>,
): boolean {
  if (quizzes.length === 0) {
    return false;
  }
  const allAnswered = quizzes.every((q) => resultsByType.has(q.quiz_type));
  if (!allAnswered) {
    return false;
  }
  return [...resultsByType.values()].every(Boolean);
}
