/**
 * 日本株ティッカーコードの妥当性検証と価格取得
 * Stooq API を利用する
 */
import { logger } from "@/shared/lib/logger";
import { LOG_MODULES } from "@/shared/lib/log-modules";

interface StooqRow {
  close: number;
  prev: number;
  changePercent: number;
  date: string;
}

function parseStooqCsv(csv: string, label: string): StooqRow {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) {
    throw new Error(`Empty CSV response from Stooq for ${label}`);
  }
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const values = lines[1].split(",").map((v) => v.trim());
  const idx = (name: string) => {
    const i = headers.indexOf(name);
    if (i === -1) {
      throw new Error(`Missing column "${name}" in Stooq CSV for ${label}`);
    }
    return i;
  };
  const close = parseFloat(values[idx("close")]);
  const prev = parseFloat(values[idx("prev")]);
  const date = values[idx("date")];
  if (isNaN(close) || isNaN(prev)) {
    throw new Error(
      `Invalid numeric data from Stooq for ${label}: close=${values[idx("close")]}, prev=${values[idx("prev")]}`,
    );
  }
  const changePercent = ((close - prev) / prev) * 100;
  return { close, prev, changePercent, date };
}

function formatStooqDate(dateStr: string): string {
  return dateStr.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
}

const STOOQ_QUOTE_URL =
  "https://stooq.com/q/l/?s={ticker}.jp&f=sd2t2ohlcpv&h&e=csv";
const FETCH_TIMEOUT_MS = 5_000;
const QUOTE_FETCH_TIMEOUT_MS = 8_000;

const TICKER_FORMAT = /^[0-9][0-9A-Z]{3}$/;

export interface TickerValidationResult {
  valid: boolean;
  error?: string;
}

export async function validateJpStockTicker(
  tickerCode: string,
): Promise<TickerValidationResult> {
  if (!TICKER_FORMAT.test(tickerCode)) {
    return {
      valid: false,
      error: "ティッカーコードは数字または英字を含む4文字で入力してください",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const url = STOOQ_QUOTE_URL.replace("{ticker}", tickerCode);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      return {
        valid: false,
        error: "銘柄データの取得に失敗しました。再度お試しください",
      };
    }

    const csv = await response.text();
    const lines = csv.trim().split("\n");
    if (lines.length < 2) {
      return { valid: false, error: "銘柄データの形式が不正です" };
    }

    const dataLine = lines[1];
    if (dataLine.includes("N/D")) {
      return {
        valid: false,
        error: `ティッカーコード「${tickerCode}」は存在しません`,
      };
    }

    return { valid: true };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { valid: false, error: "銘柄チェックがタイムアウトしました" };
    }
    return { valid: false, error: "銘柄の検証中にエラーが発生しました" };
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface JpStockQuote {
  tickerCode: string;
  close: number;
  previousClose: number;
  changePercent: number;
  date: string;
}

export async function fetchJpStockQuote(
  tickerCode: string,
): Promise<JpStockQuote | null> {
  if (!TICKER_FORMAT.test(tickerCode)) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    QUOTE_FETCH_TIMEOUT_MS,
  );

  try {
    const url = STOOQ_QUOTE_URL.replace("{ticker}", tickerCode);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      return null;
    }

    const csv = await response.text();
    const lines = csv.trim().split("\n");
    if (lines.length < 2 || lines[1].includes("N/D")) {
      return null;
    }

    const row = parseStooqCsv(csv, tickerCode);
    return {
      tickerCode,
      close: row.close,
      previousClose: row.prev,
      changePercent: Math.round(row.changePercent * 100) / 100,
      date: formatStooqDate(row.date),
    };
  } catch (error) {
    logger.warn("Failed to fetch JP stock quote", {
      module: LOG_MODULES.LIB.MARKET_DATA_NIKKEI,
      tickerCode,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchJpStockQuotesBatch(
  tickerCodes: string[],
): Promise<Map<string, JpStockQuote>> {
  const results = await Promise.allSettled(
    tickerCodes.map((code) => fetchJpStockQuote(code)),
  );

  const map = new Map<string, JpStockQuote>();
  results.forEach((result, idx) => {
    if (result.status === "fulfilled" && result.value) {
      map.set(tickerCodes[idx], result.value);
    }
  });
  return map;
}
