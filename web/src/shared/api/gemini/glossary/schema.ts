import { z } from "zod";

const glossaryCategories = [
  "基本指標",
  "チャート分析",
  "ファンダメンタルズ",
  "投資手法",
  "市場・制度",
  "リスク管理",
  "その他",
] as const;

const difficultyLevels = ["beginner", "intermediate", "advanced"] as const;

export const glossaryTermSchema = z.object({
  term: z.string().describe("用語名（例: PER、移動平均線）"),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .describe("英語スラッグ（例: per、moving-average）"),
  reading: z.string().describe("ひらがな読み（例: ぴーいーあーる）"),
  category: z.enum(glossaryCategories).describe("カテゴリ"),
  definition: z
    .string()
    .describe("一文での簡潔な定義（50文字以内）"),
  explanation: z
    .string()
    .describe(
      "初心者向けの分かりやすい解説（600〜1000文字、段落は空行(\\n\\n)で区切る）",
    ),
  example: z
    .string()
    .describe("具体的な使用例や計算例（必須・数値や場面を含める）"),
  related_terms: z
    .array(z.string())
    .min(2)
    .describe("関連用語のスラッグ一覧（2件以上）"),
  difficulty: z.enum(difficultyLevels).describe("難易度"),
});

export const glossaryTermsResponseSchema = z.object({
  terms: z
    .array(glossaryTermSchema)
    .min(5)
    .max(10)
    .describe("生成された用語一覧（5〜10件）"),
});

export const glossaryEnrichResponseSchema = glossaryTermSchema.pick({
  explanation: true,
  example: true,
  related_terms: true,
});
