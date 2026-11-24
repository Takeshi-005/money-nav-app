import { z } from "zod"
import { createJudge } from "../shared/create-judge"
import { LOG_MODULES } from "@/shared/lib/log-modules"
import type { NewsArticleContent } from "@/types/supabase"
import type { MarketSnapshot } from "./market-snapshot"

const newsArticleJudgeSchema = z.object({
  thought: z.string(),
  is_valid: z.boolean(),
  scores: z.object({
    factual_consistency: z.number().int().min(1).max(5),
    beginner_clarity: z.number().int().min(1).max(5),
    actionability: z.number().int().min(1).max(5),
    causal_chain_quality: z.number().int().min(1).max(5),
  }),
  error_type: z.enum([
    "factual_inconsistency",
    "investment_advice",
    "insufficient_explanation",
    "missing_disclaimer",
    "empty_fields",
    "weak_causal_chain",
    "none",
  ]),
  feedback_for_retry: z.string(),
})

export type NewsArticleJudgeOutput = z.infer<typeof newsArticleJudgeSchema>

const JUDGE_SYSTEM_PROMPT = `あなたは日本の金融教育コンテンツの品質審査員です。
提供されたニュース解説記事を以下の基準で審査し、JSON形式で回答してください。

## 審査基準
1. 事実整合性（factual_consistency 1-5）: ニュースソースの内容と記述が矛盾していないか。確定市場データが与えられている場合、記事中の日経平均の絶対値がそれと矛盾していないか（矛盾していれば error_type を "factual_inconsistency" とすること）
2. 初心者わかりやすさ（beginner_clarity 1-5）: 投資初心者が理解できる言葉で書かれているか、専門用語に説明があるか
3. 実践性（actionability 1-5）: 読者が何をすべきかわかるか、具体的なアクションが含まれているか
4. 因果連鎖品質（causal_chain_quality 1-5）: 以下を全て満たすか
   - marketImpact の reason が「主因 → 市場要因（為替・金利・需要・政策）→ 日本株への波及」の因果連鎖で説明されている
   - 漠然とした期待感や将来性ではなく、具体的な事象・指標・政策に基づいている
   - direction（positive/negative/neutral）が因果連鎖と整合している（無理な方向付けがない）

## is_valid=true の条件
- 全スコア（4軸）が3以上
- 明らかな投資助言（「買え」「売れ」等の断定指示）がないこと
- investorInsightが空でないこと
- marketImpact が存在する場合、nikkeiImpact.reason に具体的な因果記述があること

## error_type の判定指針
- causal_chain_quality が3未満、または因果が破綻している場合は "weak_causal_chain"

## feedback_for_retry
- is_valid=false の場合のみ具体的な修正指示を記述すること
- is_valid=true の場合は空文字列にすること`

function buildJudgePrompt(
  content: NewsArticleContent,
  newsContext: string,
  marketSnapshot?: MarketSnapshot | null,
): string {
  const marketDataSection = marketSnapshot
    ? `\n確定市場データ（Google検索で確認済みの真値）:
- 直近営業日（${marketSnapshot.asOf}）の日経平均終値: ${marketSnapshot.nikkeiClose.toLocaleString("en-US")}円（前日比 ${marketSnapshot.changeFromPrev >= 0 ? "+" : ""}${marketSnapshot.changeFromPrev.toLocaleString("en-US")}円）
記事中に日経平均の絶対値が登場する場合、この値と矛盾していないか必ず確認すること。
`
    : "";

  const sectionsText = (content.sections ?? [])
    .map((s, i) => `### セクション${i + 1}: ${s.heading}\n${s.body}`)
    .join("\n\n");

  const marketImpactText = content.marketImpact
    ? `日経平均への影響: ${content.marketImpact.nikkeiImpact?.summary ?? ""} / 理由: ${content.marketImpact.nikkeiImpact?.reason ?? ""}
TOPIXへの影響: ${content.marketImpact.topixImpact?.summary ?? ""} / 理由: ${content.marketImpact.topixImpact?.reason ?? ""}`
    : "marketImpactなし";

  return `参照ニュース概要:
${newsContext}
${marketDataSection}
## 審査対象記事
タイトル: ${content.title}
サマリー: ${content.summary}
テーマ: ${content.theme}
投資家インサイト: ${content.investorInsight}

## セクション本文
${sectionsText}

## 市場影響分析
${marketImpactText}

上記の記事を審査し、以下のJSON形式で回答してください:
{
  "thought": "判定の根拠となる思考プロセス",
  "is_valid": true,   // trueまたはfalse
  "scores": {
    "factual_consistency": 1,   // 1〜5
    "beginner_clarity": 1,      // 1〜5
    "actionability": 1,         // 1〜5
    "causal_chain_quality": 1   // 1〜5
  },
  "error_type": "none",   // いずれか1つ: factual_inconsistency / investment_advice / insufficient_explanation / missing_disclaimer / empty_fields / weak_causal_chain / none
  "feedback_for_retry": ""  // is_valid=falseの場合の具体的な修正指示（is_valid=trueの場合は空文字列）
}`
}

export function createNewsArticleJudge(
  newsContext: string,
  marketSnapshot?: MarketSnapshot | null,
) {
  return createJudge({
    systemPrompt: JUDGE_SYSTEM_PROMPT,
    buildUserPrompt: (content: NewsArticleContent) =>
      buildJudgePrompt(content, newsContext, marketSnapshot),
    outputSchema: newsArticleJudgeSchema,
    module: LOG_MODULES.LIB.GEMINI_NEWS_ARTICLE_JUDGE,
  })
}
