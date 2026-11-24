// Supabase の public スキーマ全テーブルを JSON + CSV に退避するスクリプト。
// pg_dump / supabase CLI 未導入の環境でも動くよう、PostgREST の REST API を
// service_role キーで直接叩いて全行ページングする（依存パッケージなし）。
//
// 使い方: node scripts/shutdown/02-dump-supabase.mjs [出力ディレクトリ]
// 認証: web/.env の NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY を使用。

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, "../../web/.env");
const outDir = process.argv[2] ?? "shutdown-archive/supabase";
const PAGE_SIZE = 1000;

// database.types.ts の public スキーマと対応。新規テーブルを足したらここも追加する。
const TABLES = [
  "ai_evaluations",
  "ai_generations",
  "comic_strips",
  "daily_quizzes",
  "diagnosis_cache",
  "diagnostics",
  "disclosure_events",
  "disclosure_imports",
  "glossary_terms",
  "news_articles",
  "prediction_results",
  "predictions",
  "profiles",
  "quiz_attempts",
  "quiz_cache",
  "seo_insights",
  "seo_page_performance",
  "seo_search_performance",
  "stock_impact_analyses",
  "user_performance",
  "watched_stocks",
  "weekly_reviews",
];

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

async function fetchAllRows(baseUrl, key, table) {
  const rows = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const url = `${baseUrl}/rest/v1/${table}?select=*&limit=${PAGE_SIZE}&offset=${offset}`;
    const response = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });

    if (!response.ok) {
      throw new Error(`${table}: ${response.status} ${await response.text()}`);
    }

    const page = await response.json();
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

function toCsv(rows) {
  if (rows.length === 0) return "";

  const columns = [...new Set(rows.flatMap(Object.keys))];
  const cell = (value) => {
    if (value === null || value === undefined) return "";
    const text = typeof value === "object" ? JSON.stringify(value) : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const lines = rows.map((row) => columns.map((c) => cell(row[c])).join(","));
  return [columns.join(","), ...lines].join("\n");
}

async function main() {
  const env = loadEnv(envPath);
  const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!baseUrl || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が web/.env に見つかりません",
    );
  }

  mkdirSync(outDir, { recursive: true });
  const summary = {};

  for (const table of TABLES) {
    const rows = await fetchAllRows(baseUrl, key, table);
    writeFileSync(join(outDir, `${table}.json`), JSON.stringify(rows, null, 2), "utf8");
    writeFileSync(join(outDir, `${table}.csv`), toCsv(rows), "utf8");
    summary[table] = rows.length;
    console.log(`  ${table}: ${rows.length} 行`);
  }

  writeFileSync(
    join(outDir, "_meta.json"),
    JSON.stringify(
      { project: baseUrl, exportedAt: new Date().toISOString(), rowCounts: summary },
      null,
      2,
    ),
    "utf8",
  );

  const total = Object.values(summary).reduce((a, b) => a + b, 0);
  console.log(`\n合計 ${total} 行を ${outDir} に退避しました`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
