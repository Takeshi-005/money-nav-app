import { z } from "zod";

export const DISCLOSURE_TYPES = [
  "clinical_trial_success",
  "upward_revision",
  "downward_revision",
  "share_buyback",
  "dividend_increase",
  "m_and_a",
  "business_alliance",
  "large_order",
  "regulatory",
  "other",
] as const;

export type DisclosureType = (typeof DISCLOSURE_TYPES)[number];

export const DISCLOSURE_TYPE_LABELS: Record<DisclosureType, string> = {
  clinical_trial_success: "治験成功",
  upward_revision: "上方修正",
  downward_revision: "下方修正",
  share_buyback: "自社株買い",
  dividend_increase: "増配",
  m_and_a: "M&A・買収",
  business_alliance: "業務提携",
  large_order: "大口受注",
  regulatory: "規制関連",
  other: "その他",
};

export const IMPACT_VALUES = ["positive", "negative", "neutral"] as const;
export const MAGNITUDE_VALUES = ["large", "medium", "small"] as const;
export type Impact = (typeof IMPACT_VALUES)[number];
export type Magnitude = (typeof MAGNITUDE_VALUES)[number];

const TICKER_FORMAT = /^[0-9][0-9A-Z]{3}$/;

export const analyzedDisclosureEventSchema = z.object({
  tickerCode: z
    .string()
    .transform((s) => s.trim().toUpperCase())
    .refine((s) => TICKER_FORMAT.test(s), {
      message: "4桁の数字、または数字3桁+英大文字1桁で指定してください",
    }),
  companyName: z.string().min(1).max(100),
  disclosureType: z.enum(DISCLOSURE_TYPES),
  impact: z.enum(IMPACT_VALUES),
  magnitude: z.enum(MAGNITUDE_VALUES),
  relevanceScore: z.number().min(0).max(1),
  keyConcept: z.string().min(1).max(100),
  reason: z.string().min(1).max(500),
  educationalNote: z.string().min(1).max(600),
  socialSummary: z.string().min(1).max(300),
});

export const analyzedDisclosurePayloadSchema = z.object({
  articleDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 形式で指定してください"),
  sourceUrl: z.string().url().nullable().optional(),
  events: z.array(analyzedDisclosureEventSchema).max(100),
});

export type AnalyzedDisclosureEvent = z.infer<
  typeof analyzedDisclosureEventSchema
>;
export type AnalyzedDisclosurePayload = z.infer<
  typeof analyzedDisclosurePayloadSchema
>;
