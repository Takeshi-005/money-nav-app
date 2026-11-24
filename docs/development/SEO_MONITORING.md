# SEO経過観察ガイド

マネイッポのSEO改修後の効果を継続的に計測し、適切な軌道修正を行うための **運用手順書** です。

> **このドキュメントの位置付け**
>
> - **実装ガイド**: [`SEO.md`](./SEO.md) — 「どうSEO実装するか」
> - **運用ガイド**: 本ドキュメント — 「実装後にどう効果を計測するか」

---

## 目次

- [1. 概要](#1-概要)
- [2. 計測手段一覧](#2-計測手段一覧)
- [3. 計測タイミング別の手順](#3-計測タイミング別の手順)
- [4. 定期運用ルーティン](#4-定期運用ルーティン)
- [5. SQLスニペット集](#5-sqlスニペット集)
- [6. 判定フレームワーク](#6-判定フレームワーク)
- [7. トラブルシューティング](#7-トラブルシューティング)
- [8. 参考リンク](#8-参考リンク)

---

## 1. 概要

### なぜ経過観察が必要か

SEO改修の効果は **即時 〜 数ヶ月** にわたって段階的に現れます。1週間で「効いた/効かなかった」を判定しようとすると誤った結論を出すため、**観測のタイミングと指標を明確にする** ことが重要です。

### 計測の3層構造

| レイヤー | タイミング | 主な指標 | 主な手段 |
|---|---|---|---|
| **即時系** | デプロイ当日 | Schema妥当性、ビルド成功、ページ動作 | Rich Results Test、Twitter Card Validator、`pnpm dev` |
| **短期系** | 1〜2週間後 | インデックス、表示数増加の兆候 | Search Console、Supabase、Slack週次レポート |
| **中期系** | 1ヶ月後 | クエリ別表示数・CTR・順位・滞在時間 | Search Console、GA4、Supabase集計 |
| **長期系** | 3ヶ月以降 | KPI達成度、Core Web Vitals、戦略判定 | Search Console、PageSpeed Insights、GA4 |

### マネイッポにおけるKPI

| 指標 | 改修前ベースライン | 3ヶ月目標 | 6ヶ月目標 |
|---|---|---|---|
| 週次表示回数 | 11 | 1,000 | 10,000 |
| 週次クリック数 | 0 | 30 | 300 |
| 平均掲載順位 | 53.4位 | 35位 | 20位以内 |
| `/diagnosis` 週次表示 | 不明（推定数件） | 500+ | 5,000+ |
| 「投資 診断」関連の平均順位 | 53位前後 | 35位 | 10位以内 |

---

## 2. 計測手段一覧

### ツール早見表

| ツール | 用途 | アクセス先 | 必要権限 |
|---|---|---|---|
| **Slack週次SEOレポート** | 毎週月曜9時の自動レポート | 設定済みSlackチャンネル | Slack参加 |
| **Supabase Dashboard** | 蓄積データのSQL集計 | https://supabase.com/dashboard | プロジェクトメンバー |
| **Google Search Console** | 表示数・順位・CTR・クエリ | https://search.google.com/search-console | 所有権確認済みのGoogleアカウント |
| **GA4** | ページビュー・滞在時間・直帰率 | https://analytics.google.com/ | プロパティアクセス権 |
| **Rich Results Test** | 構造化データ妥当性 | https://search.google.com/test/rich-results | 不要 |
| **PageSpeed Insights** | Core Web Vitals | https://pagespeed.web.dev/ | 不要 |
| **Twitter Card Validator** | OGP動作確認 | https://cards-dev.twitter.com/validator | Twitterアカウント |
| **Facebook Sharing Debugger** | OGP動作確認 | https://developers.facebook.com/tools/debug/ | Facebookアカウント |

### 関連実装ファイル

| 機能 | 実装ファイル |
|---|---|
| SEOデータ収集Cron | `web/src/app/api/cron/collect-seo-data/route.ts` |
| データ収集ロジック | `web/src/shared/api/seo/collect.ts` |
| インサイト抽出 | `web/src/shared/api/seo/analyzer.ts`（閾値定数 `INSIGHT_THRESHOLDS`） |
| Slackレポート送信 | `web/src/shared/api/slack/send-seo-report.ts` |
| Cronスケジュール定義 | `terraform/cloud-scheduler.tf`（`seo-data-collector` 毎週月曜9時JST） |
| DBテーブル定義 | `docs/database/migrations/013_seo_analytics.sql`、`014_seo_insights_tracking.sql` |

---

## 3. 計測タイミング別の手順

### 3-1. デプロイ当日（即時系）

#### 3-1-1. ビルド成功確認

```bash
cd web && pnpm type-check && pnpm build && pnpm test
```

すべてエラーなしを確認。

#### 3-1-2. Search Console URL検査でのインデックスリクエスト

1. https://search.google.com/search-console を開く
2. プロパティ `money-nav.com` を選択
3. 上部の検索欄に対象URL（例: `https://money-nav.com/diagnosis`）を入力
4. 「公開URLをテスト」をクリック → レンダリング結果に新コンテンツが含まれることを確認
5. 「インデックス登録をリクエスト」をクリック → Googleに再クロールを依頼

#### 3-1-3. Schema 妥当性確認（Rich Results Test）

1. https://search.google.com/test/rich-results を開く
2. URL欄に `https://money-nav.com/diagnosis` を入力
3. テスト結果で以下を確認：
   - `Quiz` Schema が検出されている
   - `FAQPage` Schema が検出されている（`/diagnosis` の場合）
   - エラー0件

主要URLは別々に確認：
- `https://money-nav.com/diagnosis`
- `https://money-nav.com/news-articles/{最新日付}`
- `https://money-nav.com/tomorrow-impact/{日付}`
- `https://money-nav.com/glossary/{slug}`

#### 3-1-4. OGP動作確認（Twitter Card Validator）

1. https://cards-dev.twitter.com/validator を開く
2. URL欄に対象URLを入力
3. プレビュー画像と説明文に「無料・登録不要・5分で完了」等の改修内容が反映されているか確認

#### 3-1-5. ローカル動作確認

```bash
cd web && pnpm dev
```

ブラウザで以下を確認：
- http://localhost:3000/diagnosis → 初期表示にランディングが表示される
- http://localhost:3000/diagnosis?start=true → 即質問フォームに飛ぶ
- FAQセクションのアコーディオン（`<details>/<summary>`）が開閉する
- 8タイプ紹介の「詳しく見る」リンクが `/investor-guides` に遷移する

---

### 3-2. 1〜2週間後（短期系）

#### 3-2-1. Search Console「パフォーマンス」レポートの見方

1. Search Console → 左メニュー「パフォーマンス」→「検索結果」
2. 期間を「過去7日間」または「過去28日間」に設定
3. 4つの指標タブ（合計クリック数 / 合計表示回数 / 平均CTR / 平均掲載順位）すべてONにする
4. 下部の「クエリ」「ページ」「国」タブを切り替えて詳細確認

**確認ポイント**:
- 表示回数の推移グラフが右肩上がりか
- 新規クエリが出現しているか（「投資 診断」「投資 初心者」等）
- `/diagnosis` のクリック数が改修前後で変化しているか

#### 3-2-2. Search Console「カバレッジ」レポート

1. 左メニュー「インデックス」→「ページ」
2. 「インデックス済み」「インデックスされていない」を確認
3. `/tomorrow-impact/{date}`、`/diagnosis`、`/news-articles/{date}` などの新URLが「インデックス済み」になっているか

#### 3-2-3. Search Console「拡張」レポートで Schema 認識状況

1. 左メニュー「拡張」→「よくある質問」をクリック
2. 「有効」のURL一覧に `/diagnosis` が含まれていることを確認
3. 同様に「クイズ」「パンくずリスト」も確認

#### 3-2-4. Slack週次レポートの読み方

毎週月曜9時にSlack `#seo-report`（または設定チャンネル）にレポートが届きます。

```
📊 週次SEOレポート

サマリー
• クリック数: X (前週差分)
• 表示回数: X (前週差分)
• 平均CTR: X% (前週差分pp)
• 平均掲載順位: X (前週差分)

⚠️ 高インプレッション低CTR (n件)
  ...

📈 順位改善候補 (n件)
  ...

🔍 コンテンツギャップ (n件)
  ...

⭐ トップパフォーマー (n件)
  ...
```

**確認ポイント**:
- 「サマリー」の各指標が改修前ベースラインから増えているか
- インサイト（low_ctr / position_improvement / content_gap / top_performer）に `/diagnosis` 関連クエリが現れているか
- 推奨アクションを参照し、追加施策を検討

> **インサイト閾値（`web/src/shared/api/seo/analyzer.ts`）**: 現在は低トラフィック向けに低めの閾値に調整済み（impressions ≥ 20、clicks ≥ 3 など）。表示数が増えてきたら適宜引き上げ検討。

#### 3-2-5. Supabaseでベースライン記録

改修翌週の月曜（Cron実行直後）に、ベースラインをCSV保存：

1. Supabase Dashboard → SQL Editor を開く
2. [5-1. ページ別ベースライン記録](#5-1-ページ別ベースライン記録) のクエリを実行
3. 結果右上の「Download CSV」をクリック
4. ファイル名を `seo-baseline-YYYY-MM-DD.csv` 形式で保存

これが将来「効果が出た」を判定するための基準データになります。

---

### 3-3. 1ヶ月後（中期系）

#### 3-3-1. GA4 でページ別パフォーマンス確認

1. https://analytics.google.com/ を開く
2. 左メニュー「レポート」→「エンゲージメント」→「ページとスクリーン」
3. 期間を「過去28日間」に設定し、改修前28日と比較
4. `/diagnosis` の以下を確認：

| 指標 | 改修前比較 | 期待 |
|---|---|---|
| 表示回数 | 改修前28日 | 1.5〜3倍 |
| 平均エンゲージメント時間 | 改修前28日 | 2〜5倍（ランディング読了で増加） |
| 直帰率 | 改修前28日 | 改善（コンテンツ充実で離脱率減少） |

#### 3-3-2. Search Console「クエリ」レポートで新規クエリ確認

1. Search Console → パフォーマンス → 検索結果
2. 期間「過去28日間」 vs 「その前28日間」の比較表示
3. 「ページ」タブで `/diagnosis` を選択
4. 「クエリ」タブで新規に表示されたクエリを確認

**期待する新規クエリ例**:
- 「投資 診断 無料」
- 「投資 初心者 始め方」
- 「投資家タイプ 診断」
- 「投資スタイル 5分」
- 「投資 診断 登録不要」

#### 3-3-3. SQLでクエリ別実績を集計

[5-2. クエリ別パフォーマンス（/diagnosis フィルタ）](#5-2-クエリ別パフォーマンスdiagnosis-フィルタ) のクエリを実行し、月次推移を確認。

---

### 3-4. 3ヶ月後（長期系）

#### 3-4-1. KPI達成度評価

[1. 概要 - マネイッポにおけるKPI](#マネイッポにおけるkpi) の3ヶ月目標と実測値を比較。

#### 3-4-2. Core Web Vitals 確認

1. https://pagespeed.web.dev/ を開く
2. URL欄に `https://money-nav.com/diagnosis` を入力
3. 「分析」をクリック
4. 「Core Web Vitals」セクションを確認：
   - **LCP (Largest Contentful Paint)**: < 2.5秒（良好）
   - **INP (Interaction to Next Paint)**: < 200ms（良好）
   - **CLS (Cumulative Layout Shift)**: < 0.1（良好）

#### 3-4-3. 戦略の継続/変更判断

[6. 判定フレームワーク](#6-判定フレームワーク) を参照し、現状の数値が🟢🟡🔴のどれに該当するか評価。

---

## 4. 定期運用ルーティン

「**毎週月曜の Slack レポートを5分眺める**」だけで80%の異常検知ができます。これは既に実装済みの自動化資産です。

| 頻度 | 何をする | 所要時間 | 担当 |
|---|---|---|---|
| **毎週月曜9時** | Slack週次SEOレポートに目を通す。サマリー4指標とインサイト一覧を5分眺める | 5分 | 担当者 |
| **毎週金曜** | Search Console「パフォーマンス」で過去7日のクエリ・順位確認 | 10分 | 担当者 |
| **月次（月初）** | GA4とSearch Consoleを比較、ベースラインと差分計算 | 30分 | 担当者 |
| **四半期ごと** | KPI評価、戦略の継続/変更を判断 | 60分 | 担当者 |
| **改修イベント時** | Schema/OGP変更後はRich Results Test実施 | 5分 | 改修実施者 |

---

## 5. SQLスニペット集

すべてSupabase Dashboard → SQL Editor で実行可能です。

### 5-1. ページ別ベースライン記録

```sql
-- 直近28日のページ別実績平均を記録
-- ベースライン用にCSVダウンロード推奨
SELECT
  CURRENT_DATE AS baseline_date,
  page_path,
  ROUND(AVG(page_views)::numeric, 1) AS avg_page_views,
  ROUND(AVG(unique_users)::numeric, 1) AS avg_unique_users,
  ROUND(AVG(avg_engagement_time)::numeric, 1) AS avg_engagement_time,
  ROUND(AVG(bounce_rate)::numeric, 3) AS avg_bounce_rate
FROM seo_page_performance
WHERE collected_at >= CURRENT_DATE - INTERVAL '28 days'
GROUP BY page_path
ORDER BY avg_page_views DESC;
```

### 5-2. クエリ別パフォーマンス（/diagnosis フィルタ）

```sql
-- /diagnosis に紐づく全クエリの推移
SELECT
  collected_at,
  query,
  SUM(impressions) AS impressions,
  SUM(clicks) AS clicks,
  ROUND(AVG(ctr)::numeric, 4) AS avg_ctr,
  ROUND(AVG(position)::numeric, 1) AS avg_position
FROM seo_search_performance
WHERE page LIKE '%/diagnosis%'
GROUP BY collected_at, query
ORDER BY collected_at DESC, impressions DESC
LIMIT 100;
```

### 5-3. 最新のSearch Console データ全体取得

```sql
SELECT
  collected_at,
  query,
  page,
  clicks,
  impressions,
  ROUND(ctr::numeric, 4) AS ctr,
  ROUND(position::numeric, 1) AS position
FROM seo_search_performance
WHERE collected_at = (SELECT MAX(collected_at) FROM seo_search_performance)
ORDER BY impressions DESC
LIMIT 50;
```

### 5-4. インサイト一覧（優先度順）

```sql
SELECT
  collected_at,
  insight_type,
  priority,
  title,
  target_query,
  target_page,
  status,
  suggested_action
FROM seo_insights
WHERE status IN ('new', 'in_progress')
ORDER BY collected_at DESC, priority DESC
LIMIT 30;
```

### 5-5. 当週 vs 前週の比較

```sql
WITH current_week AS (
  SELECT
    query,
    SUM(clicks) AS clicks,
    SUM(impressions) AS impressions,
    AVG(position) AS position
  FROM seo_search_performance
  WHERE collected_at = (SELECT MAX(collected_at) FROM seo_search_performance)
  GROUP BY query
),
previous_week AS (
  SELECT
    query,
    SUM(clicks) AS clicks,
    SUM(impressions) AS impressions,
    AVG(position) AS position
  FROM seo_search_performance
  WHERE collected_at = (
    SELECT DISTINCT collected_at
    FROM seo_search_performance
    ORDER BY collected_at DESC
    LIMIT 1 OFFSET 1
  )
  GROUP BY query
)
SELECT
  c.query,
  c.clicks AS curr_clicks,
  p.clicks AS prev_clicks,
  (c.clicks - COALESCE(p.clicks, 0)) AS click_diff,
  c.impressions AS curr_impressions,
  p.impressions AS prev_impressions,
  (c.impressions - COALESCE(p.impressions, 0)) AS impression_diff,
  ROUND(c.position::numeric, 1) AS curr_position,
  ROUND(p.position::numeric, 1) AS prev_position
FROM current_week c
LEFT JOIN previous_week p USING (query)
ORDER BY click_diff DESC NULLS LAST
LIMIT 30;
```

### 5-6. 直近4週間の表示数推移（週次トレンド）

```sql
SELECT
  collected_at,
  SUM(impressions) AS total_impressions,
  SUM(clicks) AS total_clicks,
  CASE
    WHEN SUM(impressions) > 0
    THEN ROUND((SUM(clicks)::numeric / SUM(impressions)) * 100, 2)
    ELSE 0
  END AS overall_ctr_percent,
  ROUND(AVG(position)::numeric, 1) AS avg_position,
  COUNT(DISTINCT query) AS unique_queries
FROM seo_search_performance
WHERE collected_at >= CURRENT_DATE - INTERVAL '28 days'
GROUP BY collected_at
ORDER BY collected_at DESC;
```

### 5-7. ページ別の最新エンゲージメント

```sql
SELECT
  page_path,
  page_views,
  unique_users,
  ROUND(avg_engagement_time::numeric, 1) AS engagement_time_sec,
  ROUND(bounce_rate::numeric * 100, 1) AS bounce_rate_pct
FROM seo_page_performance
WHERE collected_at = (SELECT MAX(collected_at) FROM seo_page_performance)
ORDER BY page_views DESC
LIMIT 30;
```

---

## 6. 判定フレームワーク

毎月のレビューで以下の3段階のどれに該当するかを判定し、対応を決定します。

### 🟢 改善成功の兆候

これらが2つ以上揃ったら、施策は成功軌道に乗っています：

- Schema が Search Console「拡張」レポートで認識されている
- 週次表示回数の推移が**右肩上がり**
- 平均エンゲージメント時間が改修前比で**1.5倍以上**
- 新規クエリ（特に「投資 診断」「投資 初心者」系）が出現
- 平均掲載順位が**毎月3〜5位ずつ上昇**

**次のアクション**: 現状の戦略を継続し、P1/P2タスクの実装に進む。

### 🟡 様子見の兆候

これらが見られたら、軽微な調整を加えて1〜2ヶ月再観察：

- 表示回数は増えたがクリック数が伸びない → **CTR改善が必要**
  - description・OGP画像の訴求を見直す
  - スニペットに表示される文言を強化
- 順位は上がったが10位以内に届かない → **コンテンツの充実が必要**
  - 該当ページの本文を追加
  - 内部リンク密度を上げる
- インデックスはされたが3ヶ月経過しても表示が少ない → **ドメインオーソリティ不足**
  - 外部リンク獲得施策を検討
  - 関連トピックでのコンテンツ拡充

### 🔴 要対処の兆候

これらが見られたら、即座に対応：

- **Schema にエラー検出** → ロールバック検討、Rich Results Test で詳細確認
- **LCP > 4秒** → 画像最適化、JS削減、`next/image` 適用確認
- **直帰率が改修前より悪化** → ランディングUXに問題、ユーザビリティ調査
- **Search Console にクロールエラー** → robots.txt、noindex設定の誤りを確認

---

## 7. トラブルシューティング

### 7-1. 「Search Console に表示数0が続く」

**原因候補**:
1. インデックスがまだ完了していない（新規URLは1〜4週間かかる）
2. ドメイン認証が切れている
3. robots.txt が誤って `Disallow: /` 設定されている

**対処**:
```bash
# robots.txt の現状確認
curl https://money-nav.com/robots.txt
```
- Search Console → URL検査で対象URLが「インデックス登録済み」か確認
- 「インデックス未登録」なら「インデックス登録をリクエスト」をクリック

### 7-2. 「Schema エラーが出る」

**対処**:
1. https://search.google.com/test/rich-results で詳細エラー確認
2. 該当する `web/src/app/**/page.tsx` の JSON-LD を Read
3. `web/src/shared/lib/structured-data.ts` のヘルパが正しく呼ばれているか確認
4. ローカル `pnpm build` で再ビルドし、`view-source` で出力JSON-LD確認

### 7-3. 「Cloud Logging に SEO 関連エラー」

**対処**:
1. GCP Console → Cloud Logging → クエリ:
   ```
   resource.type="cloud_run_revision"
   jsonPayload.context.module=~"seo|cron"
   severity>=ERROR
   ```
2. エラーが `collect-seo-data` 関連なら、`SEARCH_CONSOLE_SITE_URL` / `GA4_PROPERTY_ID` 環境変数の設定を確認
3. Google API のクォータ超過なら、リトライ間隔の調整を `web/src/shared/api/seo/collect.ts` で検討

### 7-4. 「Slack週次レポートが届かない」

**対処**:
1. GCP Console → Cloud Scheduler → `seo-data-collector` ジョブの「最終実行ステータス」を確認
2. 失敗なら Cloud Logging で原因確認
3. 成功なら `SLACK_WEBHOOK_URL` 環境変数の設定を確認
4. テスト送信:
   ```bash
   curl -X POST $SLACK_WEBHOOK_URL \
     -H 'Content-Type: application/json' \
     -d '{"text":"テスト送信"}'
   ```

### 7-5. 「ベースラインが記録できていない」

**対処**:
- 改修日に近い `collected_at` のデータが `seo_search_performance` / `seo_page_performance` に存在するか確認
- 存在しない場合は手動でCron実行：
  ```bash
  # 管理者権限が必要。Cloud Console → Cloud Scheduler → seo-data-collector → 「強制実行」
  ```

---

## 8. 参考リンク

### 内部ドキュメント

- [SEO実装ガイド (`SEO.md`)](./SEO.md) — メタデータ・構造化データの実装方法
- [データベース設計](../architecture/DATABASE.md) — `seo_*` テーブルの全体設計

### 関連実装ファイル

- データ収集 Cron: [`web/src/app/api/cron/collect-seo-data/route.ts`](../../web/src/app/api/cron/collect-seo-data/route.ts)
- 収集ロジック: [`web/src/shared/api/seo/collect.ts`](../../web/src/shared/api/seo/collect.ts)
- インサイト抽出: [`web/src/shared/api/seo/analyzer.ts`](../../web/src/shared/api/seo/analyzer.ts)
- Slack送信: [`web/src/shared/api/slack/send-seo-report.ts`](../../web/src/shared/api/slack/send-seo-report.ts)
- Cronスケジュール: [`terraform/cloud-scheduler.tf`](../../terraform/cloud-scheduler.tf)
- DBマイグレーション: [`docs/database/migrations/013_seo_analytics.sql`](../database/migrations/013_seo_analytics.sql)

### 外部公式ツール

- [Google Search Console](https://search.google.com/search-console)
- [Google Analytics 4](https://analytics.google.com/)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)

### 外部ガイドライン

- [Google Search Central](https://developers.google.com/search)
- [Helpful Content Update](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Schema.org Documentation](https://schema.org/)
