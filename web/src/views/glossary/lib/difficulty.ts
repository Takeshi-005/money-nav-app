import type { GlossaryTerm } from "@/entities/glossary-term";

type Difficulty = GlossaryTerm["difficulty"];

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "初心者向け",
  intermediate: "中級者向け",
  advanced: "上級者向け",
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: "bg-positive-50 text-positive-700",
  intermediate: "bg-accent-50 text-accent-700",
  advanced: "bg-negative-50 text-negative-700",
};

export function getDifficultyMeta(difficulty: Difficulty): {
  label: string;
  color: string;
} {
  return {
    label: DIFFICULTY_LABELS[difficulty],
    color: DIFFICULTY_COLORS[difficulty],
  };
}
