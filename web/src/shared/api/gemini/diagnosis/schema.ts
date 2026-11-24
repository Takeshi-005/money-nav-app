/**
 * 診断機能の Zod スキーマ
 */
import { z } from "zod";

export const investorTypeCodes = [
  "BUFFETT",
  "LYNCH",
  "SOROS",
  "GRAHAM",
  "ONEILL",
  "TEMPLETON",
  "BOGLE",
  "DALIO",
] as const;

export const diagnosisSchema = z.object({
  typeCode: z
    .enum(investorTypeCodes)
    .describe("投資家タイプコード（8タイプから選択）"),
  investorType: z
    .string()
    .describe("投資家タイプ名（例: バフェット型（価値の賢者））"),

  resultText: z.string().describe("診断結果の説明文（300文字程度）"),
  famousQuote: z.string().describe("このタイプの投資家の有名な格言"),

  strengths: z.array(z.string()).length(3).describe("このタイプの強み（3つ）"),
  weaknesses: z
    .array(z.string())
    .length(3)
    .describe("このタイプの注意点（3つ）"),

  actionAdvice: z
    .string()
    .describe("具体的な投資行動アドバイス（100文字程度）"),

  recommendedSectors: z.array(z.string()).describe("推奨セクター（3つ）"),
  suggestedTickers: z
    .array(
      z.object({
        code: z.string().describe("銘柄コード"),
        name: z.string().describe("銘柄名"),
        reason: z.string().describe("推奨理由（50文字以内）"),
      }),
    )
    .describe("推奨銘柄（3つまで）"),
});
