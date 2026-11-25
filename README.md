# AI投資パートナー（マネイッポ）

## 開発の進め方

企画・設計・技術選定・運用の判断は自分で行い、実装では生成AI（Claude Code など）を補助として使いました。
AIに任せる範囲とレビューの観点は、[`CLAUDE.md`](./CLAUDE.md) と [`.claude/`](./.claude/) のルールで決めています。

> このリポジトリは公開用に作り直したもので、開発中のコミット履歴と Pull Request は含みません。文書中の `#81` などの番号は、元のリポジトリの Pull Request を指します。

### 公開前のセキュリティ見直し

公開にあたってコード全体を見直し、見つかった問題を直しました。内容は 2 つ目以降のコミットで確認できます。

| 見つかった問題 | 対応 |
| --- | --- |
| RLS のポリシーで対象のロールを指定しておらず、匿名ユーザーにも書き込みを許していた。RLS が無効のテーブルもあった | 不要なポリシーを削除し、すべてのテーブルで RLS を有効化（[`035_security_hardening.sql`](./docs/database/migrations/035_security_hardening.sql)） |
| 利用者が自分のプロフィールの管理者フラグ・経験値を書き換えられた | 利用者のトークンからは変更できないようトリガーで制限し、経験値の付与をサーバー側に移動 |
| ログイン後の戻り先を検証しておらず、外部サイトへ誘導できた（オープンリダイレクト） | サイト内のパスだけを許可する関数を追加 |
| JSON-LD の埋め込みで `</script>` を含む文字列を逃がしていなかった | `<` などを Unicode エスケープする関数に統一 |
| Cloud Scheduler の OIDC トークンで宛先（audience）を検証していなかった | Terraform で宛先を定め、アプリ側でも検証 |
| 管理用 API が DB のエラー文をそのまま返していた | 一般的なメッセージを返し、詳細はログへ |
| 依存ライブラリに既知の脆弱性（Next.js の重大なものを含む） | Next.js 16.4・zod 4 などへ更新し、本番依存の既知の脆弱性を 0 件に |

## 概要

AIによる「投資スタイル診断」と「デイリーニュースクイズ」を提供し、金融リテラシー向上を支援するサービスです。

**「銘柄を教える」のではなく、「選び方と読み解き方を教える」**

- ゲストユーザーでも診断・クイズが利用可能
- ログイン後にデータを同期して継続学習

---

## 主要機能

### メイン機能（学習サービスの中核）

#### 🎯 AI投資スタイル診断

9つの質問からユーザーの投資目的・リスク許容度を分析し、8つの投資家タイプ（バフェット型、グレアム型など）に分類。

#### 📈 予測トレーニング

今日起きたニュースが翌営業日にとって「プラス材料」「マイナス材料」のどちらに作用するかを予想して、ニュースを読み解く力を養うことができます。

#### 📊 学習ダッシュボード

解答数、正解率、連続解答日数、現在のレベルを一目で確認。投資家レベルでゲーミフィケーション。

#### 🗺️ 投資家成長ロードマップ

「興味 → 診断 → 練習 → 口座開設 → 初めての1株 → 継続」の一本道で、いまの現在地と次の一歩を可視化。診断・クイズ・予測トレーニングの既存シグナルから到達段階を判定し、口座開設・初購入の自己申告で前進を記録します。

---

### 補助機能（学習を深めるコンテンツ）

#### 🎓 投資家ガイド

診断結果の8タイプそれぞれに対応する詳細学習ガイドを動的生成。自分のタイプを軸にした学び方を提示します。

#### 📚 用語集（グロッサリー）

投資用語をAIが解説。学習しながら語彙を広げられます。※ 新規用語の自動生成は SEO 品質のため現在停止中（#17）。既存用語の閲覧は継続。

#### 📰 ニュース解説記事

その日の投資関連ニュースをAIが初心者向けに分かりやすく解説します。※ 大手メディアと競合し差別化困難なため日次自動生成は停止（コンテンツ戦略の選択と集中）。既存記事の閲覧は継続。

#### 📋 明日の好悪材料分析（適時開示）

適時開示情報を扱う公開記事から銘柄ごとの開示イベントを AI が構造化。翌営業日に動きそうな銘柄を一覧化します。

**特徴**:

- TDnet 由来の開示を Gemini で「ポジティブ / ネガティブ / ニュートラル」判定
- relevanceScore × 影響度の重み付けで重要度をスコアリング
- 銘柄単位で「なぜ動きそうか」「初心者向けの読み解きポイント」を提示
- `/admin/disclosures` で記事貼り付け → `/tomorrow-impact` で公開閲覧

#### 📄 法的ページ

利用規約、プライバシーポリシー、免責事項、サービス概要ページを完備。安心してご利用いただけます。

---

### 運用機能（社内向け管理画面 `/admin`）

- **SEO監査**: Search Console + GA4 からデータ収集し、流入動向を分析。※ 週次の自動収集は停止（#77）。収集済みデータの閲覧は継続
- **監視銘柄管理**: サービス全体の銘柄リストを管理する内部 UI
- **適時開示記事の取り込み**: 適時開示情報を扱う公開記事の本文を貼り付けて、AI が銘柄ごとの開示イベントを構造化して保存

---

## 技術スタック

| カテゴリ           | 技術                                           |
| ------------------ | ---------------------------------------------- |
| Frontend / Backend | Next.js 16 (App Router)                        |
| UI Framework       | React 19                                       |
| UI Components      | shadcn / lucide-react                          |
| Styling            | Tailwind CSS 4 + CVA                           |
| Data Fetching      | TanStack Query (React Query)                   |
| Validation         | Zod                                            |
| Architecture       | Feature-Sliced Design (FSD)                    |
| Infrastructure     | Google Cloud Run                               |
| Database           | Supabase                                       |
| Authentication     | Supabase Auth                                  |
| AI SDK             | `@google/genai` (Vertex AI / Gemini 2.5 Flash) |
| Retry              | p-retry (AI 呼び出しのリトライ制御)            |
| RSS / XML          | fast-xml-parser (ニュース取得)                 |
| Notification       | Slack Webhook (バッチ通知 / X 下書き / SEOレポート) |
| Scheduler          | Cloud Scheduler                                |
| Testing            | Vitest + Testing Library                       |
| Logging            | Cloud Logging                                  |
| IaC                | Terraform                                      |

---

## 技術的ハイライト

### Feature-Sliced Design (FSD)

スケーラビリティとメンテナンス性を重視したアーキテクチャを採用。レイヤー構成（entities, features, widgets, shared）により、依存関係を明確化。

> 詳細: [docs/architecture/FRONTEND_ARCHITECTURE.md](./docs/architecture/FRONTEND_ARCHITECTURE.md)

### TanStack Query (React Query)

サーバーステートのキャッシュ管理とデータ取得を最適化。QueryKeyの一元管理、queryOptionsパターン、Server Componentとの併用により、パフォーマンスとUXを両立。

### CVA (Class Variance Authority)

型安全なUI設計により、バリアント駆動のスタイル管理を実現。16の汎用UIコンポーネントで一貫性のあるデザインシステムを構築。

### Tailwind CSS 4

Canonical Classesを採用し、カスタムグラデーションを一元定義。保守性の高いスタイリングを実現。

---

## クイックスタート

```bash
# 1. リポジトリをクローン
git clone https://github.com/Takeshi-005/kabu-news-ai.git
cd kabu-news-ai/web

# 2. 依存関係をインストール
pnpm install

# 3. 環境変数を設定
cp .env.example .env
# .env を編集

# 4. 開発サーバーを起動
pnpm dev

# 5. ブラウザでアクセス
open http://localhost:3000

# 6. テスト実行
pnpm test          # watch モード
pnpm test:run      # 1回実行
pnpm test:coverage # カバレッジ確認
pnpm test:ci       # CI 用 (verbose + coverage)

# 7. 型チェック
pnpm type-check

# 8. 補助スクリプト
pnpm gen:types         # Supabase 型生成
pnpm glossary:update   # 用語集の手動更新
pnpm seo:report        # SEO定期レポート用データを集計出力（/seo-report skill が使用）
```

---

## ドキュメント

詳細なドキュメントは [docs/](./docs/README.md) を参照してください。

| カテゴリ     | リンク                                                |
| ------------ | ----------------------------------------------------- |
| システム構成 | [docs/architecture/](./docs/architecture/OVERVIEW.md) |
| セットアップ | [docs/setup/](./docs/setup/LOCAL.md)                  |
| 開発ガイド   | [docs/development/](./docs/development/WEB.md)        |
| デプロイ     | [docs/deployment/](./docs/deployment/CICD.md)         |
| API一覧      | [docs/reference/](./docs/reference/API.md)            |

---

## アーキテクチャ

```
Cloud Scheduler (3ジョブ / 全ジョブ停止中)
├── (停止中) 毎日     → /api/cron/generate-prediction       # #77: サービス提供終了に伴い停止(paused)
├── (停止中) 日曜     → /api/cron/generate-glossary-terms  # #17: 飽和語の新規量産を停止(paused)
└── (停止中) 月曜     → /api/cron/collect-seo-data          # #77: SEO計測を終了(paused)
    │
    ▼
Cloud Run (Next.js)
├── Web UI
│   ├── /diagnosis              # 投資スタイル診断 (app 直下)
│   ├── /quiz                   # デイリークイズ / 予測トレーニング (app 直下)
│   ├── (main)/                 # 共通レイアウトが当たるグループ
│   │   ├── /dashboard              # 学習ダッシュボード
│   │   ├── /roadmap                # 投資家成長ロードマップ
│   │   ├── /investor-guides        # 投資家ガイド
│   │   ├── /glossary               # 用語集
│   │   ├── /news-articles          # ニュース解説記事
│   │   ├── /tomorrow-impact        # 明日の好悪材料分析（適時開示）/ [date] 日付別 / [date]/[ticker] 開示イベント個別ページ
│   │   └── /admin/{seo-audit, watched-stocks, disclosures}  # 社内
│   └── (legal)/                # 法的ページ (/about, /terms, /privacy 他)
├── React Query (キャッシュ管理)
├── API Routes
│   ├── /api/diagnosis
│   ├── /api/quiz
│   ├── /api/predictions
│   ├── /api/news-articles
│   ├── /api/disclosure-impact   # 明日の好悪材料の取得
│   ├── /api/market-data
│   ├── /api/sync
│   ├── /api/health
│   ├── /api/admin/{seo-audit, watched-stocks, disclosures/{import,preview}, glossary/backfill}
│   └── /api/cron/* (generate-prediction, generate-news-article, generate-glossary-terms, collect-seo-data)
└── Vertex AI Gemini 2.5 Flash
    │
    ▼
Supabase
```

---

## ディレクトリ構成

```
kabu-news-ai/
├── README.md                    # このファイル
├── CLAUDE.md                    # 開発者向けクイックリファレンス
├── docs/                        # 詳細ドキュメント
│   ├── QUICK_START.md           # クイックスタート
│   ├── architecture/            # アーキテクチャ
│   ├── setup/                   # セットアップ
│   ├── development/             # 開発ガイド
│   ├── deployment/              # デプロイ
│   ├── reference/               # リファレンス
│   ├── business/                # ビジネス要件
│   ├── database/                # データベース設計
│   ├── specifications/          # 機能仕様
│   ├── issues/                  # 既知の課題
│   └── research/                # 調査メモ
├── web/                         # Next.js アプリケーション
│   ├── Dockerfile               # 本番用Dockerイメージ
│   ├── src/app/                 # ページ・APIルート
│   │   ├── diagnosis/           # 投資スタイル診断 (app 直下)
│   │   ├── quiz/                # デイリークイズ / 予測トレーニング (app 直下)
│   │   ├── (main)/              # メインのページグループ（共通レイアウト適用）
│   │   │   ├── dashboard/           # 学習ダッシュボード
│   │   │   ├── roadmap/             # 投資家成長ロードマップ
│   │   │   ├── investor-guides/     # 投資家ガイド
│   │   │   ├── glossary/            # 用語集
│   │   │   ├── news-articles/       # ニュース解説記事
│   │   │   ├── tomorrow-impact/     # 明日の好悪材料分析
│   │   │   └── admin/               # 社内向け管理画面
│   │   ├── (legal)/             # 法的ページグループ (/about, /terms, /privacy 他)
│   │   └── api/                 # REST API エンドポイント
│   ├── src/entities/            # ビジネスエンティティ (FSD)
│   ├── src/features/            # ビジネス機能 (FSD)
│   ├── src/widgets/             # 大規模UI (FSD)
│   ├── src/shared/              # 共通ユーティリティ・UI・API連携 (FSD)
│   └── src/views/               # ページビュー (FSD)
└── terraform/                   # インフラ定義
```

**Feature-Sliced Design (FSD)** を採用し、スケーラビリティとメンテナンス性を向上。

> 詳細: [docs/architecture/FRONTEND_ARCHITECTURE.md](./docs/architecture/FRONTEND_ARCHITECTURE.md)

---

## コスト

GCP無料枠内で運用（月額 ¥0〜400 程度）

---

## ライセンス

MIT
