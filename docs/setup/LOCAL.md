# ローカル開発環境

Next.js開発環境の構築手順です。

---

## 💡 この手順から学べること

- **pnpm** によるパッケージ管理
- **Next.js 16 (App Router)** の開発サーバー起動
- **環境変数** の設定方法
- **Supabase** との接続テスト

---

## 前提条件

| ツール  | バージョン | 確認コマンド    |
| ------- | ---------- | --------------- |
| Node.js | 20.x 以上  | `node -v`       |
| pnpm    | 9.x 以上   | `pnpm -v`       |
| Git     | 2.x 以上   | `git --version` |

### 📚 学習ポイント: なぜ pnpm？

```
【npm】
- node_modules が肥大化しやすい
- ディスク容量を大量消費

【pnpm】
- シンボリックリンクで共有
- 同じパッケージは1回だけダウンロード
- インストールが高速
```

pnpmをインストールしていない場合：

```bash
# Homebrewでインストール（Mac）
brew install pnpm

# または npm でインストール
npm install -g pnpm
```

---

## セットアップ手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/your-username/kabu-news-ai.git
cd kabu-news-ai
```

### 2. webディレクトリへ移動

```bash
cd web
```

### 📚 ディレクトリ構造の理解

```
kabu-news-ai/
├── web/              # ← ここで開発
│   ├── src/
│   ├── package.json
│   └── ...
├── terraform/        # インフラ定義
└── docs/            # ドキュメント
```

### 3. 依存関係をインストール

```bash
pnpm install
```

### 📚 実行されること

1. `package.json` の `dependencies` と `devDependencies` をダウンロード
2. `node_modules/` ディレクトリに配置
3. `pnpm-lock.yaml` で依存関係のバージョンを固定

### 4. 環境変数を設定

```bash
# テンプレートをコピー
cp .env.example .env

# エディタで編集
code .env   # VSCode
# または
vim .env
```

### 📚 設定が必要な環境変数

以下の環境変数を `.env` に設定してください：

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GCP_PROJECT_ID`（Vertex AI 用。ローカルは `gcloud auth application-default login` で認証）
- `GOOGLE_CLOUD_LOCATION`
- `CRON_SECRET`（任意: `/api/test/` エンドポイントのローカルテスト用）

各環境変数の詳細な取得方法は [環境変数ドキュメント](./SECRETS.md) を参照してください。

### 5. 開発サーバーを起動

```bash
pnpm dev
```

### 📚 実行されること

```
> next dev

   ▲ Next.js 16.1.1
   - Local:        http://localhost:3000
   - Environments: .env

 ✓ Starting...
 ✓ Ready in 2.3s
```

1. Next.jsの開発サーバーが起動
2. `.env` が自動的に読み込まれる
3. ファイル変更時に自動リロード（Hot Reload）

### 6. ブラウザでアクセス

```bash
open http://localhost:3000
```

ランディングページが表示されれば成功！

---

## 動作確認

### ヘルスチェックAPI

```bash
curl http://localhost:3000/api/health
```

期待するレスポンス：

```json
{
  "status": "ok",
  "timestamp": "2026-01-13T10:00:00.000Z"
}
```

### Supabase接続確認

1. ブラウザで http://localhost:3000/login にアクセス
2. Googleログインを試行
3. 認証が成功すれば `/dashboard` にリダイレクト

### Gemini API確認

1. ブラウザで http://localhost:3000/diagnosis にアクセス
2. 診断フォームに入力して送信
3. AIの診断結果が表示されれば成功

---

## よく使うコマンド

| コマンド          | 用途                        |
| ----------------- | --------------------------- |
| `pnpm dev`        | 開発サーバー起動            |
| `pnpm build`      | 本番用ビルド                |
| `pnpm start`      | 本番サーバー起動（要build） |
| `pnpm lint`       | ESLint実行                  |
| `pnpm type-check` | TypeScript型チェック        |

### 📚 学習ポイント: dev vs build vs start

```
【pnpm dev】
- 開発モード
- ソースマップあり、最適化なし
- ファイル変更で自動リロード

【pnpm build】
- 本番用にコンパイル
- minify、Tree Shaking
- .next/ ディレクトリに出力

【pnpm start】
- ビルド済みファイルを配信
- 本番環境と同じ動作確認
```

---

## トラブルシューティング

### node_modules がおかしい場合

```bash
# node_modules を削除して再インストール
rm -rf node_modules
pnpm install
```

### ポート3000が使用中の場合

```bash
# 別ポートで起動
pnpm dev -p 3001
```

### 環境変数が読み込まれない場合

1. ファイル名が `.env` であることを確認（`.env` ではない）
2. 開発サーバーを再起動
3. `NEXT_PUBLIC_` プレフィックスが正しいか確認

### 📚 学習ポイント: NEXT*PUBLIC* の意味

```
【NEXT_PUBLIC_ あり】
- クライアント（ブラウザ）でも使用可能
- JavaScriptにバンドルされる
- 機密情報には使用しない

【NEXT_PUBLIC_ なし】
- サーバーサイドのみで使用
- API Route でのみアクセス可能
- 機密情報に使用
```

---

## 次のステップ

- [GCP設定](./GCP.md) - 本番環境の準備
- [環境変数](./SECRETS.md) - 各サービスのキー取得方法
- [Next.js開発](../development/WEB.md) - コンポーネント開発ガイド
