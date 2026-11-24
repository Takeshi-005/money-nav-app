// Search Console の検索パフォーマンスを CSV に退避するスクリプト。
// サービス停止後もキーワード設計の資産として残すため、API の上限である直近16ヶ月分を
// 3つの切り口（query×page / query単体 / date単体）で全行ページングして落とす。
//
// 前提: webmasters.readonly スコープ付きの ADC が必要。
//   gcloud auth application-default login \
//     --scopes=https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/cloud-platform
//
// 使い方: node scripts/shutdown/01-export-gsc.mjs [出力ディレクトリ]

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SITE_URL = "sc-domain:money-nav.com";
const API_BASE = "https://searchconsole.googleapis.com/webmasters/v3/sites";
// ADC で searchconsole API を叩くにはクォータ帰属先の明示が必須。
// クライアントライブラリなら ADC の quota_project_id から自動付与されるが、生 fetch では自前で送る。
const QUOTA_PROJECT = "ai-product-446711";
const PAGE_SIZE = 25000;
const LOOKBACK_MONTHS = 16;

const outDir = process.argv[2] ?? "shutdown-archive/gsc";

function accessToken() {
  return execFileSync(
    "gcloud",
    ["auth", "application-default", "print-access-token"],
    { encoding: "utf8" },
  ).trim();
}

function dateRange() {
  // GSC は当日データを返さないため終端を3日前に置き、そこから16ヶ月遡る
  const end = new Date();
  end.setDate(end.getDate() - 3);
  const start = new Date(end);
  start.setMonth(start.getMonth() - LOOKBACK_MONTHS);
  const iso = (d) => d.toISOString().slice(0, 10);
  return { startDate: iso(start), endDate: iso(end) };
}

async function queryAllRows(token, dimensions, range) {
  const url = `${API_BASE}/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`;
  const rows = [];

  for (let startRow = 0; ; startRow += PAGE_SIZE) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-goog-user-project": QUOTA_PROJECT,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...range,
        dimensions,
        rowLimit: PAGE_SIZE,
        startRow,
        dataState: "final",
      }),
    });

    if (!response.ok) {
      throw new Error(
        `GSC API ${response.status}: ${await response.text()}`,
      );
    }

    const page = (await response.json()).rows ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

function toCsv(dimensions, rows) {
  const escape = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const header = [...dimensions, "clicks", "impressions", "ctr", "position"];
  const lines = rows.map((row) =>
    [
      ...row.keys.map(escape),
      row.clicks,
      row.impressions,
      row.ctr,
      row.position,
    ].join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

async function main() {
  const token = accessToken();
  const range = dateRange();
  mkdirSync(outDir, { recursive: true });

  const cuts = [
    { name: "query-page", dimensions: ["query", "page"] },
    { name: "query", dimensions: ["query"] },
    { name: "date", dimensions: ["date"] },
  ];

  console.log(`site=${SITE_URL} ${range.startDate} → ${range.endDate}`);

  for (const cut of cuts) {
    const rows = await queryAllRows(token, cut.dimensions, range);
    const path = join(outDir, `${cut.name}.csv`);
    writeFileSync(path, toCsv(cut.dimensions, rows), "utf8");
    console.log(`  ${cut.name}: ${rows.length} 行 → ${path}`);
  }

  writeFileSync(
    join(outDir, "_meta.json"),
    JSON.stringify({ site: SITE_URL, ...range, exportedAt: new Date().toISOString() }, null, 2),
    "utf8",
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
