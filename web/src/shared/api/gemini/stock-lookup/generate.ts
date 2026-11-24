import { ai, GEMINI_MODEL } from "../client";
import { callGeminiWithRetry } from "../retry";
import { companyNameSchema } from "./schema";

async function callGeminiGrounded(prompt: string): Promise<string> {
  const response = await callGeminiWithRetry(() =>
    ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    }),
  );
  const text = response.text;
  if (!text) {
    throw new Error("Gemini APIからの応答が空です");
  }
  return text;
}

function extractJsonObject(text: string): string {
  const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fenced) {
    return fenced[1];
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return text.substring(start, end + 1);
  }
  return text.trim();
}

export async function lookupJpCompanyName(tickerCode: string): Promise<string> {
  const prompt = `日本の東京証券取引所に上場している証券コード「${tickerCode}」の銘柄について、Google検索で正確な情報を確認した上で、正式な日本語企業名のみを返してください。

証券コードの形式:
- 数字4桁（例: 7203）
- 2024年以降の新規上場銘柄は数字3桁+英字1桁の4文字形式（例: 285A）

要件:
- 略称ではなく正式名称（例: 「ソニーG」ではなく「ソニーグループ」）
- 「株式会社」「(株)」などの法人格は含めない
- 検索で確認できなかった場合は推測せず、companyName を空文字にする

JSON形式のみを返し、説明文は含めないでください:
{ "companyName": "トヨタ自動車" }`;

  const rawText = await callGeminiGrounded(prompt);
  const jsonText = extractJsonObject(rawText);
  const result = companyNameSchema.safeParse(JSON.parse(jsonText));

  if (!result.success) {
    throw new Error(
      `銘柄名のスキーマ検証に失敗しました: ${result.error.message}`,
    );
  }

  const name = result.data.companyName.trim();
  if (!name) {
    throw new Error(
      `証券コード「${tickerCode}」の銘柄名を取得できませんでした`,
    );
  }

  return name;
}
