import type { NewsArticle } from "@/shared/api/news-api";

export const PREDICTION_PROMPT_VERSION = "prediction-v2.0";

export function buildPredictionQuestionPrompt(
  newsArticles: NewsArticle[],
  date: string,
): string {
  const newsContext = newsArticles
    .slice(0, 5)
    .map((a, i) => `${i + 1}. ${a.title}\n   ${a.description ?? ""}`)
    .join("\n");

  return `あなたは投資教育の専門家です。
${date}の市場ニュースから、投資初心者が「翌営業日にとってプラス材料かマイナス材料か」を考える練習問題を1問作成してください。

## 今日のニュース候補
${newsContext}

## 要件

- 上記から教育価値の高いニュースを1件選び、それを軸に問題を作る
- question: 「このニュースは明日の市場にとってプラス材料？マイナス材料？」型の問いを30〜80文字で。具体的にどの企業/出来事に着目するかが明確になるよう書くこと
- contextSummary: 選んだニュースのポイントを100〜200文字で要約。「なぜそれが市場心理に影響しうるか」を初心者向けに簡潔に説明

## 制約

- 特定銘柄への投資推奨は禁止
- 「プラス材料 (up)」「マイナス材料 (down)」の2択で答えられる問題にすること
- 市場指数 (日経平均/TOPIX) の具体的な数値や予想値には言及しない
- 初心者でも30秒で読める内容にすること

以下のJSON形式で回答してください:`;
}

export function buildPredictionResolutionPrompt(
  contextSummary: string,
  question: string,
  date: string,
): string {
  return `あなたは投資教育の専門家です。
${date}に出題された次の予測問題について、その後の市場の反応を踏まえて「プラス材料 / マイナス材料」のどちらに作用したかを判定し、初心者向けの解説を作成してください。

## 出題された問題
${question}

## 判断材料となったニュース要約
${contextSummary}

## 判定手順

1. このニュースの続報・関連 IR/プレスリリース・主要メディアの解釈を Web 検索で確認
2. 翌営業日以降の市場心理として「プラス材料」「マイナス材料」のどちらに認識されたかを判定
3. 判定根拠を初心者にわかりやすい言葉で説明

## 出力要件

- materialDirection: "up" (プラス材料) または "down" (マイナス材料)
- explanation: 200〜400文字。「①ニュースの本質 → ②市場がどう受け止めたか → ③次回に活かせる視点」の3段構成。具体的な指数値や株価には言及しない (一般化された影響だけを語る)

以下のJSON形式で回答してください:`;
}
