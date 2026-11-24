type PredictionRecord = {
  is_correct: boolean | null;
  pnl: number | null;
};

export interface PerformanceStats {
  total: number;
  correct: number;
  winRate: number;
  totalPnl: number;
  currentStreak: number;
  maxStreak: number;
}

export function calculatePerformanceStats(
  predictions: PredictionRecord[],
): PerformanceStats | null {
  if (predictions.length === 0) {
    return null;
  }

  const total = predictions.length;
  const correct = predictions.filter((p) => p.is_correct).length;
  const winRate = Math.round((correct / total) * 10000) / 10000;
  const totalPnl = predictions.reduce((sum, p) => sum + (p.pnl ?? 0), 0);

  let maxStreak = 0;
  let streak = 0;
  for (const p of predictions) {
    if (p.is_correct) {
      streak += 1;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 0;
    }
  }

  return {
    total,
    correct,
    winRate,
    totalPnl: Math.round(totalPnl * 10000) / 10000,
    currentStreak: streak,
    maxStreak,
  };
}
