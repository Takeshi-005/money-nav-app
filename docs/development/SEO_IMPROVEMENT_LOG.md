# SEO インデックス改善ログ（2026-06）

Google Search Console のインデックス未登録問題に対する技術的 SEO 改善の振り返り記録。実装完了から 90 日（2026-08-23）まで効果を観測する。

> **ドキュメントの位置付け**
> - **実装ガイド**: [`SEO.md`](./SEO.md) — 「どう実装するか」
> - **運用ガイド**: [`SEO_MONITORING.md`](./SEO_MONITORING.md) — 「実装後にどう計測するか」
> - **監査評価**: [`SEO_AUDIT_EVALUATION.md`](./SEO_AUDIT_EVALUATION.md) — 「90 日後の判定基準」
> - **本ドキュメント**: 「2026-06 に何をどう改善したか」

---

## 背景

GSC 「ページのインデックス登録」レポートで以下の課題が判明:

| 課題 | 件数 | 原因 |
|---|---|---|
| クロール済み - インデックス未登録 | 10 | E-E-A-T 不足、サイト権威性が低い |
| 見つかりませんでした (404) | 12 | 削除済み機能 + 中古ドメイン履歴 + ハック由来 URL |
| ページにリダイレクトがあります | 2 | canonical 不一致 |

**ベースライン（2026-05-25）**: 登録済 1 件、週次表示 13 回、クリック 0、平均掲載順位 7.8 位。

---

## Phase 0: 404・リダイレクト対応（2026-06-08, `6d36b72`）

サイト全体の品質スコアを下げる「壊れたリンク」を解消。

- 削除済み機能 URL を関連ページへ 301 リダイレクト（`next.config.ts`）
  - `/market-insights` → `/news-articles`、`/qa` → `/glossary`、`/limit-moves` → `/tomorrow-impact` 等 7 パターン（`/stock-insights` は機能削除に伴い 2026-07 に `/tomorrow-impact` へ再割当）
- 中古ドメイン履歴由来の `/article/*` を 410 Gone（`middleware.ts`）
- **ハック系ランダム URL（`/ol58gb46m/` 等）はリダイレクトせず 404 のまま放置**（リダイレクトするとソフト 404 判定リスク）

---

## Phase 1: クロール予算節約（2026-06-08, `82e13a6`）

Googlebot がクロールを諦めないよう、ページ応答を高速化。

- `force-dynamic` → `revalidate` (ISR) で TTFB を 1.5s → 200ms へ
- `generateStaticParams` で主要動的ページ（`/glossary/[slug]`, `/weekly-review/[week]` 等）を事前生成
- `sitemap.ts` の `lastModified` を毎ビルド変動する `new Date()` からパスごとの固定値マップへ変更
- `useSearchParams()` を使うクライアントコンポーネントを `<Suspense>` でラップ

**結果**: 登録済み 1 → 17（2026-05-29 → 06-01 観測）

---

## Phase 2: E-E-A-T シグナル強化（2026-06-09, `26db6c6`）

Google に「このサイトは信頼できる運営主体が作っている」と伝える。

- **glossary/[slug]** に `DefinedTerm` + `Article` + `BreadcrumbList` 構造化データ追加（`author` / `publisher` / `datePublished` / `dateModified`）
- **news-articles/[date]** に `NewsArticle` + `BreadcrumbList` 構造化データ追加
- **glossary detail** に「同カテゴリ・同 difficulty 優先」の関連用語リンク（最大 5 件）追加
- **weekly-review detail** に前週/翌週ナビゲーション追加
- **glossary 生成 cron** で upsert 後に `notifySearchEngines()`（IndexNow + Google/Bing ping）

**結果**: 登録済み 17 → 34（検出済み URL 42 → 242 と Google のクロール意欲が顕著に上昇）

---

## 主な学び

- **「クロール済み未登録」と「検出 - 未登録」は別カテゴリ・別戦略**: 前者は質的改善、後者はクロール促進
- **中古ドメイン履歴の URL には 410 Gone**: リダイレクトすると Google が「ソフト 404」と判定する
- **AI 生成自体は問題ではない**: Google が罰するのは「価値の薄いコンテンツ」であって AI 利用ではない
- **307/308 と 301 は SEO 上等価**: Next.js デフォルトの 308 で問題ない
- **新興サイトは「検出 - 未登録」が膨らむ**: クロール予算問題は時間と外部被リンクで解決する

---

## 次の判断ポイント（2026-06-23）

Phase 0/1/2 のデプロイ反映と GSC 評価には 2 週間かかるため、それまで新規実装は凍結。GSC データを見て次を決める:

| 観測指標 | アクション |
|---|---|
| 登録済み ≥ 60 | ✅ 完了で打ち止め |
| クロール済み未登録 が 9 件のまま横ばい | 🟡 Phase 3-A 着手（glossary `explanation` 400→800 字、weekly-review `beginnerTakeaway` 200 字以上） |
| 検出 184 件がほぼ減らず | 🔴 クロール予算問題、外部被リンク戦略へ転換 |

---

## 関連リソース

- 詳細評価基準: [`SEO_AUDIT_EVALUATION.md`](./SEO_AUDIT_EVALUATION.md)
- 計測手順: [`SEO_MONITORING.md`](./SEO_MONITORING.md)
- 実装パターン: [`SEO.md`](./SEO.md)
- トラッカー: GitHub issue #1
- コミット詳細: `git show 6d36b72`（Phase 0）/ `git show 82e13a6`（Phase 1）/ `git show 26db6c6`（Phase 2）

> 注: 本ドキュメントの「結果」「件数」は実装時点のスナップショットです。最新値は GSC を直接参照してください。
