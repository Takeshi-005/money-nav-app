import { z } from "zod";
// eslint-disable-next-line boundaries/dependencies -- shared → entities の逆流。gemini のエンティティ別分解（#60後続）で解消予定
import { NEWS_CATEGORIES } from "@/entities/news-article/lib/constants";

export const marketImpactEntrySchema = z.object({
  direction: z.enum(["positive", "negative", "neutral"]),
  magnitude: z.enum(["large", "medium", "small"]),
  summary: z.string().max(150).describe("影響の要約（150文字以内）"),
  reason: z
    .string()
    .min(50)
    .max(300)
    .regex(
      /%|円|ドル|円高|円安|金利|利下げ|利上げ/,
      "reason must include a numeric or monetary reference (%, 円, ドル, 金利, etc.)",
    )
    .describe("因果関係の解説（300文字以内、初心者向け、数値・専門用語を必ず含む）"),
});

export const marketImpactSchema = z.object({
  nikkeiImpact: marketImpactEntrySchema.describe("日経平均への影響"),
  topixImpact: marketImpactEntrySchema.describe("TOPIXへの影響"),
  affectedSectors: z
    .array(
      z.object({
        name: z.string().max(20).describe("セクター名（20文字以内）"),
        impact: z.enum(["positive", "negative", "neutral"]),
        reason: z
          .string()
          .min(15)
          .max(100)
          .describe("影響理由（15〜100文字、具体的な因果を含めること）"),
      }),
    )
    .max(4)
    .describe("影響を受けるセクター（最大4つ）"),
  educationalNote: z
    .string()
    .max(200)
    .describe("初心者向け因果関係解説（200文字以内）"),
});

export const keyTermSchema = z.object({
  term: z.string().max(40).describe("専門用語（40文字以内）"),
  slug: z
    .string()
    .nullable()
    .optional()
    .describe("用語辞典の英語スラッグ（用語辞典に存在する場合のみ指定、不明な場合は必ず null）"),
  definition: z.string().max(200).describe("用語の定義（200文字以内）"),
});

export const articleSectionSchema = z.object({
  heading: z.string().min(5).max(80).describe("セクションの見出し（80文字以内）"),
  body: z.string().min(100).max(1000).describe("セクションの本文（400-1000文字）"),
  keyTerms: z
    .array(keyTermSchema)
    .max(3)
    .describe("このセクションで出てくる専門用語（最大3つ）"),
});

export const newsArticleContentSchema = z.object({
  title: z.string().min(10).max(100).describe("記事タイトル（100文字以内）"),
  summary: z.string().min(30).max(200).describe("リード文・要約（200文字以内）"),
  theme: z.string().max(20).describe("今日のテーマ（例: 米国金利、円安）"),
  category: z
    .enum(NEWS_CATEGORIES)
    .optional()
    .describe(
      "記事カテゴリ（市場動向/金融政策/為替/政治経済/企業業績/テクノロジー/世界経済）",
    ),
  sections: z
    .array(articleSectionSchema)
    .min(2)
    .max(4)
    .describe("記事セクション（2-4個）"),
  investorInsight: z
    .string()
    .min(30)
    .max(400)
    .describe("投資家目線のまとめ・実践アドバイス（400文字以内）"),
  relatedTopics: z
    .array(z.string().max(40))
    .min(2)
    .max(5)
    .describe("関連テーマ（2-5個）"),
  actionItems: z
    .array(z.string().max(100))
    .min(2)
    .max(3)
    .optional()
    .describe("初心者向けアクションアイテム（2-3個、各100文字以内）"),
  xPostBody: z
    .string()
    .min(1)
    .max(140)
    .describe("Xポスト用の本文（140文字以内、ハッシュタグ・URL除く）"),
  marketImpact: marketImpactSchema
    .optional()
    .describe("市場への影響分析（日経平均・TOPIX・セクター）"),
});
