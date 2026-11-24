import type { DailyQuizContent } from "@/types/supabase";
import type { RecentQuizSummary } from "./prompt";

export function extractQuizSummaries(
  quizzes: { content: unknown }[] | null,
): RecentQuizSummary[] {
  if (!quizzes) {
    return [];
  }

  return quizzes.flatMap((quiz) => {
    const content = quiz.content as unknown as DailyQuizContent;
    if (!content.quizzes) {
      return [];
    }
    return content.quizzes.map((q) => ({
      title: q.title,
      question: q.question,
      mainConcept: `${q.title}（${q.quiz_type}）`,
      quizType: q.quiz_type,
      subTheme: q.sub_theme,
    }));
  });
}
