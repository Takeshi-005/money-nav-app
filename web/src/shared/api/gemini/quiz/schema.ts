/**
 * クイズ機能の Zod スキーマ
 */
import { z } from "zod"

export const quizTypes = [
  "news",
  "scenario",
  "psychology",
  "history",
  "basic",
] as const;

export type QuizType = (typeof quizTypes)[number];

export const singleQuizSchema = z.object({
  quiz_type: z.enum(quizTypes).describe("クイズタイプ"),
  title: z.string().min(5).max(20).describe("クイズのタイトル（5〜20文字）"),
  question: z.string().min(20).max(200).describe("問題文（20〜200文字）"),
  options: z
    .array(
      z.object({
        id: z.number().describe("選択肢ID（1, 2, 3）"),
        text: z.string().min(3).describe("選択肢テキスト（3文字以上）"),
      })
    )
    .length(3)
    .describe("3択の選択肢"),
  correct_option_id: z.number().int().min(1).max(3).describe("正解の選択肢ID（1〜3）"),
  explanation: z.string().min(30).max(400).describe("正解の解説（30〜400文字）"),
  sub_theme: z.string().optional().describe("サブテーマ（生成後に外部から注入）"),
});

export const dailyQuizzesSchema = z.object({
  quizzes: z.array(singleQuizSchema).length(3).describe("3問のクイズ"),
});
