import { z } from "zod";
import { ai, GEMINI_MODEL } from "../client";
import { callGeminiWithRetry } from "../retry";
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";

export interface MarketSnapshot {
  nikkeiClose: number;
  changeFromPrev: number;
  asOf: string;
}

const snapshotSchema = z.object({
  nikkeiClose: z.number().positive(),
  changeFromPrev: z.number(),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    return null;
  }
  return text.slice(start, end + 1);
}

/**
 * 検索経由で取得した値の妥当性を機械的に検証する。
 * グラウンディングもLLM経由のため、古い値・桁違いの値・未来日付などを
 * ここで弾き、怪しい場合は false を返して null フォールバックに落とす。
 */
const MAX_DAILY_CHANGE_RATIO = 0.15;
const MAX_STALE_DAYS = 7;

function isPlausibleSnapshot(
  snapshot: MarketSnapshot,
  requestDate: string,
): boolean {
  if (
    Math.abs(snapshot.changeFromPrev) / snapshot.nikkeiClose >
    MAX_DAILY_CHANGE_RATIO
  ) {
    return false;
  }

  if (snapshot.asOf > requestDate) {
    return false;
  }

  const staleDays =
    (Date.parse(requestDate) - Date.parse(snapshot.asOf)) /
    (24 * 60 * 60 * 1000);
  if (staleDays > MAX_STALE_DAYS) {
    return false;
  }

  return true;
}

/**
 * Google検索グラウンディングで直近の日経平均終値・前日比を取得する。
 * グラウンディングはJSON構造化出力（responseMimeType）と併用できないため、
 * テキスト応答からJSONを抽出してパースする。取得・検証に失敗した場合は null を返し、
 * 呼び出し側は「株価水準を断定しない」フォールバックに切り替える。
 */
export async function fetchMarketSnapshot(
  date: string,
): Promise<MarketSnapshot | null> {
  const prompt = `Google検索を使って、${date}時点で判明している直近の日経平均株価（終値）と前日比を調べてください。
以下のJSONのみを出力してください（コードフェンス・説明文・引用は一切含めない）:
{"nikkeiClose": 数値, "changeFromPrev": 数値, "asOf": "YYYY-MM-DD"}
- nikkeiClose: 直近の日経平均終値（円、整数、カンマなし）
- changeFromPrev: 前日比（円、上昇は正の数、下落は負の数）
- asOf: その終値がついた営業日の日付（YYYY-MM-DD形式。${date}の市場がまだ引けていない場合は前営業日になる）
確かな値が確認できない場合は {"nikkeiClose": null, "changeFromPrev": null, "asOf": null} を出力してください。`;

  try {
    const response = await callGeminiWithRetry(() =>
      ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0,
        },
      }),
    );

    const text = response.text;
    if (!text) {
      logger.warn("MarketSnapshot: Gemini応答が空", {
        module: LOG_MODULES.LIB.GEMINI_MARKET_SNAPSHOT,
        date,
      });
      return null;
    }

    const jsonText = extractJsonObject(text);
    if (!jsonText) {
      logger.warn("MarketSnapshot: 応答からJSONを抽出できず", {
        module: LOG_MODULES.LIB.GEMINI_MARKET_SNAPSHOT,
        date,
      });
      return null;
    }

    const parsed = snapshotSchema.safeParse(JSON.parse(jsonText));
    if (!parsed.success) {
      logger.warn("MarketSnapshot: 値の検証に失敗（値未確定の可能性）", {
        module: LOG_MODULES.LIB.GEMINI_MARKET_SNAPSHOT,
        date,
      });
      return null;
    }

    if (!isPlausibleSnapshot(parsed.data, date)) {
      logger.warn("MarketSnapshot: 妥当性チェックに失敗（値を破棄）", {
        module: LOG_MODULES.LIB.GEMINI_MARKET_SNAPSHOT,
        date,
        nikkeiClose: parsed.data.nikkeiClose,
        changeFromPrev: parsed.data.changeFromPrev,
        asOf: parsed.data.asOf,
      });
      return null;
    }

    logger.info("MarketSnapshot: 日経平均を取得", {
      module: LOG_MODULES.LIB.GEMINI_MARKET_SNAPSHOT,
      date,
      nikkeiClose: parsed.data.nikkeiClose,
      changeFromPrev: parsed.data.changeFromPrev,
      asOf: parsed.data.asOf,
    });
    return parsed.data;
  } catch (error) {
    logger.warn("MarketSnapshot: 取得中にエラー", {
      module: LOG_MODULES.LIB.GEMINI_MARKET_SNAPSHOT,
      date,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
