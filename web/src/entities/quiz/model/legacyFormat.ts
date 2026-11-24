import type { SingleQuiz } from "@/types/supabase"

export interface LegacyQuizContent {
  newsTitle: string
  newsSummary: string
  quizQuestion: string
  options: { id: number; text: string }[]
  correctOptionId: number
  explanation: string
}

export function isLegacyFormat(content: unknown): content is LegacyQuizContent {
  return (
    typeof content === "object" &&
    content !== null &&
    "newsTitle" in content &&
    !("quizzes" in content)
  )
}

export function convertLegacyToNew(content: LegacyQuizContent): SingleQuiz[] {
  return [
    {
      quiz_type: "news",
      title: content.newsTitle,
      question: content.quizQuestion,
      options: content.options,
      correct_option_id: content.correctOptionId,
      explanation: content.explanation,
    },
  ]
}
