# クイックスタートガイド

初めての方向けのスタートガイドです。このページから始めましょう。

---

## 1分で理解するプロジェクト概要

**AI投資パートナー** は、投資初心者向けの学習支援アプリです。

```
┌─────────────────────────────────────────┐
│  「銘柄を教える」のではなく、           │
│  「選び方と読み解き方を教える」         │
└─────────────────────────────────────────┘
```

### 主要機能

| 機能                   | 説明                          |
| ---------------------- | ----------------------------- |
| **AI投資スタイル診断** | 9つの質問で投資家タイプを診断 |
| **デイリークイズ**     | 毎日3問で投資判断を学習       |
| **市場解説**           | 日経平均下落時にAIが解説      |
| **ダッシュボード**     | 学習進捗を可視化              |

### 技術スタック

```
フロントエンド: Next.js 16 + React 19
スタイリング:   Tailwind CSS 4
データベース:   Supabase
AI:            Vertex AI (Gemini 2.5 Flash)
インフラ:       Cloud Run + Cloud Scheduler
```

---

## 5分で環境構築

### 前提条件

```bash
# 必要なツール
node -v    # v20.x 以上
pnpm -v    # v9.x 以上
git --version
```

### Step 1: リポジトリをクローン

```bash
git clone https://github.com/Takeshi-005/kabu-news-ai.git
cd kabu-news-ai/web
```

### Step 2: 依存関係をインストール

```bash
pnpm install
```

### Step 3: 環境変数を設定

```bash
cp .env.example .env
```

`.env` を編集して、以下を設定：

```env
# アプリケーション設定（必須）
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase（必須）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Vertex AI（ローカルはADC認証。APIキー不要）
# 事前に: gcloud auth application-default login
GCP_PROJECT_ID=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=asia-northeast1

# Cron認証（任意）
CRON_SECRET=your-random-secret
```

> **Supabaseの設定方法**: [環境変数ドキュメント](./setup/SECRETS.md)

### Step 4: 開発サーバーを起動

```bash
pnpm dev
```

### Step 5: ブラウザでアクセス

```
http://localhost:3000
```

---

## 10分で最初のデモ動作

### 1. ランディングページを確認

`http://localhost:3000` にアクセスして、トップページが表示されることを確認。

### 2. 投資スタイル診断を試す

1. 「診断を始める」をクリック
2. 9つの質問に回答
3. 診断結果が表示されることを確認

> **ポイント**: ログインしなくても診断できます（ゲストモード）

### 3. クイズを試す

1. 「クイズに挑戦」をクリック
2. 3問のクイズに回答
3. 正解・不正解と解説が表示されることを確認

### 4. ダッシュボードを確認

1. ログインする（Google認証）
2. `/dashboard` にアクセス
3. レベル・経験値・診断結果が表示されることを確認

---

## よくあるトラブル

### 開発サーバーが起動しない

```bash
# ポートが使用中の場合
lsof -i :3000
kill -9 <PID>

# 依存関係の再インストール
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 環境変数エラー

```
Error: NEXT_PUBLIC_SUPABASE_URL is not defined
```

→ `.env` ファイルが存在し、正しく設定されているか確認

### Supabase接続エラー

→ Supabaseダッシュボードでプロジェクトが起動中か確認

詳細: [トラブルシューティング](./reference/TROUBLESHOOTING.md)

---

## 次に読むべきドキュメント

### 初心者向け（1週間目）

| 順番 | ドキュメント                                   | 学べること           |
| ---- | ---------------------------------------------- | -------------------- |
| 1    | [システム構成](./architecture/OVERVIEW.md)     | アーキテクチャ全体像 |
| 2    | [データベース設計](./architecture/DATABASE.md) | スキーマ設計         |
| 3    | [Next.js開発ガイド](./development/WEB.md)      | 実装パターン         |

### 中級者向け（2週間目以降）

| 順番 | ドキュメント                                                 | 学べること         |
| ---- | ------------------------------------------------------------ | ------------------ |
| 1    | [FSDアーキテクチャ](./architecture/FRONTEND_ARCHITECTURE.md) | フロントエンド設計 |
| 2    | [APIリファレンス](./reference/API.md)                        | エンドポイント仕様 |
| 3    | [CI/CD](./deployment/CICD.md)                                | 自動デプロイ       |

### 特定トピック

| トピック             | ドキュメント                               |
| -------------------- | ------------------------------------------ |
| ゲーミフィケーション | [設計思想](./architecture/GAMIFICATION.md) |
| AI統合               | [LLMOps（Gemini の生成と品質管理）](./development/LLMOPS.md) |
| インフラ             | [Terraform](./development/TERRAFORM.md)    |

---

## 開発コマンド早見表

```bash
# 開発
pnpm dev              # 開発サーバー起動
pnpm build            # 本番ビルド
pnpm type-check       # 型チェック
pnpm lint             # ESLint

# テスト
pnpm test             # テスト実行
pnpm test:coverage    # カバレッジ出力

# Supabase
pnpm gen:types        # 型定義生成
```

---

## 関連リンク

- [README](../README.md) - プロジェクト概要
- [CLAUDE.md](../CLAUDE.md) - 開発者向けリファレンス
- [環境変数設定](./setup/SECRETS.md) - 詳細な設定手順
