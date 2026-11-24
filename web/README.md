# AI投資パートナー - Web Application

Next.js 16 (App Router) を使用した投資学習アプリケーション。

---

## 主な機能

- **AI投資スタイル診断**: 9つの質問から8タイプの投資家スタイルを診断
- **デイリーニュースクイズ**: 毎日3問（時事・基本・シナリオ）のクイズで学習
- **クイズ履歴**: 過去の回答履歴と統計（正解率・連続解答日数）を確認
- **学習ダッシュボード**: 経験値・レベルによるゲーミフィケーション
- **ゲストユーザー対応**: ログイン不要で診断・クイズを体験可能
- **ダークモード**: システム設定連動 + 手動切替

---

## 技術スタック

| 項目           | 技術                       |
| -------------- | -------------------------- |
| フレームワーク | Next.js 16 (App Router)    |
| UI             | React 19                   |
| スタイリング   | Tailwind CSS 4             |
| チャート       | Chart.js + react-chartjs-2 |
| 言語           | TypeScript 5               |
| データベース   | Supabase                   |
| 認証           | Supabase Auth              |
| AI             | Gemini API                 |
| パッケージ管理 | pnpm                       |

---

## ディレクトリ構造

```
src/
├── app/                       # ページ（App Router）
│   ├── page.tsx               # ランディングページ
│   ├── layout.tsx             # ルートレイアウト
│   ├── globals.css            # グローバルスタイル
│   │
│   ├── login/
│   │   └── page.tsx           # ログインページ
│   ├── dashboard/
│   │   └── page.tsx           # ダッシュボード
│   ├── diagnosis/
│   │   └── page.tsx           # 投資スタイル診断
│   ├── quiz/
│   │   ├── page.tsx           # デイリークイズ
│   │   └── history/
│   │       └── page.tsx       # クイズ履歴
│   │
│   ├── api/                   # API Routes
│   │   ├── health/route.ts    # ヘルスチェック
│   │   ├── diagnosis/route.ts # AI診断実行
│   │   ├── quiz/route.ts      # クイズ取得・回答
│   │   ├── quiz/history/route.ts  # クイズ履歴取得
│   │   ├── sync/route.ts      # データ同期
│   │   └── cron/
│   │       └── generate-quiz/route.ts  # クイズ生成バッチ
│   │
│   └── auth/
│       └── callback/route.ts  # OAuth コールバック
│
├── widgets/                   # 大規模UI (FSD)
│   └── header/                # Header / PageHeader
│
├── shared/                    # 共通ユーティリティ・UI (FSD)
│   └── ui/
│       ├── typography/        # Typography（使用必須）
│       ├── icons/             # SVGアイコンライブラリ
│       └── cta-button/        # CTAボタン
│
├── lib/                       # ユーティリティ
│   ├── auth-context.tsx       # 認証コンテキスト
│   ├── gemini.ts              # Gemini API 連携
│   ├── guest-storage.ts       # ゲストユーザー用ストレージ
│   └── supabase/
│       ├── client.ts          # クライアント用
│       ├── server.ts          # サーバー用
│       └── admin.ts           # 管理者用
│
├── types/                     # 型定義
│   ├── database.types.ts      # Supabase 自動生成
│   └── supabase.ts            # カスタム型
│
└── middleware.ts              # 認証ミドルウェア
```

---

## 開発コマンド

```bash
# 依存関係インストール
pnpm install

# 開発サーバー起動 (http://localhost:3000)
pnpm dev

# 本番ビルド
pnpm build

# 本番サーバー起動
pnpm start

# ESLint 実行
pnpm lint

# 型チェック
pnpm type-check
```

---

## 環境変数

`.env` ファイルを作成して設定:

```bash
cp .env.example .env
```

必要な環境変数：Supabase、Gemini API、Cron認証用シークレット

詳細な設定方法: [環境変数ドキュメント](../docs/setup/SECRETS.md)

---

## API Routes

| メソッド | パス                       | 説明                         |
| -------- | -------------------------- | ---------------------------- |
| GET      | `/api/health`              | ヘルスチェック               |
| POST     | `/api/diagnosis`           | AI診断実行                   |
| GET      | `/api/diagnosis`           | 過去の診断結果取得           |
| GET      | `/api/quiz`                | 今日のクイズ取得             |
| POST     | `/api/quiz`                | クイズ回答送信               |
| GET      | `/api/quiz/history`        | クイズ履歴・統計取得         |
| POST     | `/api/cron/generate-quiz`  | クイズ生成バッチ             |

詳細: [API リファレンス](../docs/reference/API.md)

---

## デプロイ

### Dockerfile

```bash
docker build -t kabu-news-ai .
```

### Cloud Run

GitHub Actions で自動デプロイ:

- main ブランチへの push でビルド & デプロイ
- PR 作成でビルドテスト

詳細: [CI/CD ドキュメント](../docs/deployment/CICD.md)

---

## 詳細ドキュメント

- [Next.js 開発ガイド](../docs/development/WEB.md) - 実装パターン
- [API リファレンス](../docs/reference/API.md) - エンドポイント仕様
- [トラブルシューティング](../docs/reference/TROUBLESHOOTING.md) - よくある問題

---

## ライセンス

MIT
