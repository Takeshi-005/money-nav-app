# 用語集の整理方針（#17）

流入施策 #15 / #16 の総仕上げ。飽和ヘッドワード中心の用語集が低権威ドメインの品質評価を希釈しているため、(1) 新規量産の停止と (2) 保守的な noindex を行う。

## 監査（2026-06-30 時点）

- 用語集 **146件**。うち **138件が説明500字未満**（#11 の厚み増は実装済だがバックフィル未実行）。
- GSC で表示があるのは **4件のみ**：`cash-flow-statement`(10impr/pos62) / `pbr`(6/97) / `per`(4/68) / `shareholders-equity`(2/79)。残り 142件は表示ゼロ。
- 生成 cron（毎週日曜）が飽和語を無制限量産 → 過去に約240ページ急増 → index 急落の経緯。
- 重複：`nikkei-225` と `nikkei-average` が同一「日経平均株価」。

## 実施内容

1. **生成 cron を完全停止**：`terraform/cloud-scheduler.tf` の `glossary_generator` に `paused = true`。
2. **保守的 noindex**：コード側 denylist（`web/src/entities/glossary-term/model/noindex.ts`）。ページは描画しつつ `robots: noindex`、sitemap から除外。
3. **重複1件を 301**：`/glossary/nikkei-average` → `/glossary/nikkei-225`（`web/next.config.ts`）。

## keep / noindex の基準

**KEEP（noindex しない）**

- GSC 表示 > 0：`cash-flow-statement`, `pbr`, `per`, `shareholders-equity`
- 開示イベント `key_concept` にリンクする語（#16 相乗、リンク先が noindex になるのを防ぐ）：`stock-issue`(銘柄), `dividend-yield`(配当利回り), `ordinary-income`(経常利益), `execution`(約定)
- 実需のあるビギナーコア語：`nisa`, `tsumitate-nisa`, `ideco`, `mutual-fund`, `diversification`, `compound-interest`, `dollar-cost-averaging` など

**noindex（保守的初期リスト・9件／迷ったら残す）**

| slug | 用語 | 理由 |
|---|---|---|
| `nikkei-average` | 日経平均株価 | `nikkei-225` と完全重複（301併用） |
| `margin-balance` | 信用残 | advanced・ニッチ |
| `margin-maintenance-ratio` | 信用評価損益率 | advanced・ニッチ |
| `sector-rotation` | セクターローテーション | advanced・ニッチ |
| `itayose` | 板寄せ | 取引メカニズムの細目・初心者検索ほぼ無し |
| `circuit-breaker` | サーキットブレーカー | 稀・ニッチ |
| `total-asset-turnover` | 総資産回転率 | ニッチ指標 |
| `net-asset-value` | 基準価額 | 投信の細目 |
| `margin-call` | 追証 | 信用取引の細目 |

## スコープ外（将来）

- 138件の薄い用語の enrich/バックフィル（`POST /api/admin/glossary/backfill`、prod書込＋Geminiコストの手動作業）。
- 大規模な統合・削除・301（`nikkei-average` の1件を除く）。
- noindex リストの拡大は、上記の効果測定（2〜4週）後に判断。DB列での運用が必要になれば移行。

## 効果測定

- crawled-not-indexed の減少、飽和語ページの index からの除外、サイト全体の index 品質。結果は issue #1 に時系列で記録。最終判定日は 2026-08-23。
