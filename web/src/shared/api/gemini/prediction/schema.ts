import { z } from "zod";

export const predictionQuestionSchema = z.object({
  question: z
    .string()
    .min(20)
    .max(100)
    .describe("予測問題文（例: 中央銀行が政策金利を据え置き。明日にとってプラス材料？マイナス材料？）"),
  contextSummary: z
    .string()
    .min(30)
    .max(200)
    .describe("判断材料となるニュース要約（200文字以内）"),
});

export const predictionResolutionSchema = z.object({
  materialDirection: z
    .enum(["up", "down"])
    .describe("判定結果: up=プラス材料, down=マイナス材料"),
  explanation: z
    .string()
    .min(50)
    .max(400)
    .describe("結果の解説（400文字以内、3段構成）"),
});

export type PredictionQuestionOutput = z.infer<typeof predictionQuestionSchema>;
export type PredictionResolutionOutput = z.infer<typeof predictionResolutionSchema>;
