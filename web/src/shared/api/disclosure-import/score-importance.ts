import type { AnalyzedDisclosureEvent } from "@/shared/api/gemini/disclosure-extraction";

export const TOP_N_PER_IMPORT = 5;

/**
 * 学習価値スコア = claude.ai が relevanceScore に詰めた「初心者にとっての学習価値」
 * 高い順に並べて Top N を返す
 */
export function pickTopByLearningValue(
  events: AnalyzedDisclosureEvent[],
  topN: number,
): AnalyzedDisclosureEvent[] {
  return [...events]
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topN);
}
