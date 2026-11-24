// SEO 定期レポート用データ取得スクリプト。
// Supabase の seo_search_performance(GSC) / seo_page_performance(GA4) から
// 直近2スナップショットを読み、診断レンズで集計した「蒸留済みJSON」だけを stdout に出す。
// 生の行データをコンテキストに載せないことでトークン効率を保つ（seo-growth-advisor と同思想）。
//
// 使い方: cd web && node scripts/seo/pull-seo-data.mjs
// 認証: web/.env の NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY を使用。

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const here = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(here, "../../.env");

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const round = (n, d = 2) => {
  const p = 10 ** d;
  return Math.round(n * p) / p;
};

async function main() {
  const env = loadEnv(envPath);
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が web/.env に見つかりません",
    );
  }
  const sb = createClient(url, key);

  // 直近の collected_at を新しい順に取得（search/page それぞれ）
  const { data: spDates } = await sb
    .from("seo_search_performance")
    .select("collected_at")
    .order("collected_at", { ascending: false })
    .limit(500);
  const searchSnapshots = [...new Set((spDates || []).map((r) => r.collected_at))];
  const current = searchSnapshots[0];
  const previous = searchSnapshots[1] ?? null;

  if (!current) {
    console.log(JSON.stringify({ error: "seo_search_performance にデータがありません" }));
    return;
  }

  const [{ data: cur }, prevRes, { data: pageDates }] = await Promise.all([
    sb.from("seo_search_performance").select("*").eq("collected_at", current),
    previous
      ? sb.from("seo_search_performance").select("*").eq("collected_at", previous)
      : Promise.resolve({ data: [] }),
    sb
      .from("seo_page_performance")
      .select("collected_at")
      .order("collected_at", { ascending: false })
      .limit(500),
  ]);
  const prev = prevRes.data || [];

  const pageSnapshots = [...new Set((pageDates || []).map((r) => r.collected_at))];
  const pageCurrent = pageSnapshots[0] ?? null;
  const { data: pages } = pageCurrent
    ? await sb.from("seo_page_performance").select("*").eq("collected_at", pageCurrent)
    : { data: [] };

  const sum = (rows) =>
    rows.reduce(
      (a, r) => ({ clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions }),
      { clicks: 0, impressions: 0 },
    );
  const sc = sum(cur);
  const sp = sum(prev);

  // 診断レンズ
  const quickWins = cur
    .filter((r) => r.position >= 4 && r.position <= 15 && r.impressions >= 5)
    .sort((a, b) => b.impressions - a.impressions)
    .map((r) => ({ query: r.query, page: r.page, impressions: r.impressions, clicks: r.clicks, ctr: round(r.ctr * 100), position: round(r.position) }));

  const ctrGaps = cur
    .filter((r) => r.position <= 10 && r.impressions >= 8 && r.ctr < 0.03)
    .sort((a, b) => b.impressions - a.impressions)
    .map((r) => ({ query: r.query, page: r.page, impressions: r.impressions, ctr: round(r.ctr * 100), position: round(r.position) }));

  const prevMap = Object.fromEntries(prev.map((r) => [`${r.query}|${r.page}`, r]));
  const drops = cur
    .map((r) => {
      const p = prevMap[`${r.query}|${r.page}`];
      if (!p) return null;
      const di = r.impressions - p.impressions;
      if (di >= 0) return null;
      return { query: r.query, page: r.page, deltaImpressions: di, deltaClicks: r.clicks - p.clicks, positionBefore: round(p.position), positionAfter: round(r.position) };
    })
    .filter(Boolean)
    .sort((a, b) => a.deltaImpressions - b.deltaImpressions);

  // GA4: /admin は収集時除外済みだが防御的にフィルタ
  const visiblePages = (pages || []).filter((r) => !(r.page_path === "/admin" || r.page_path.startsWith("/admin/")));
  const topPages = visiblePages
    .sort((a, b) => b.page_views - a.page_views)
    .slice(0, 15)
    .map((r) => ({ path: r.page_path, views: r.page_views, users: r.unique_users, bounceRate: round(r.bounce_rate * 100), engagementSec: round(r.avg_engagement_time) }));

  // 上位impressionsクエリ（全体像把握用に上位15）
  const topQueries = [...cur]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15)
    .map((r) => ({ query: r.query, page: r.page, impressions: r.impressions, clicks: r.clicks, ctr: round(r.ctr * 100), position: round(r.position) }));

  const report = {
    _meta: {
      generatedAt: new Date().toISOString(),
      searchCurrentSnapshot: current,
      searchPreviousSnapshot: previous,
      pageSnapshot: pageCurrent,
      searchRowsCurrent: cur.length,
      searchRowsPrevious: prev.length,
      note: "GSCの検索データは内部トラフィックの影響を受けない。週次スナップショットのため日次の急変は捉えない。小規模サイトはサンプル不足に留意。",
    },
    summary: {
      current: { clicks: sc.clicks, impressions: sc.impressions, ctr: sc.impressions ? round((sc.clicks / sc.impressions) * 100) : 0 },
      previous: { clicks: sp.clicks, impressions: sp.impressions, ctr: sp.impressions ? round((sp.clicks / sp.impressions) * 100) : 0 },
    },
    topQueries,
    quickWins,
    ctrGaps,
    drops,
    ga4TopPages: topPages,
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
