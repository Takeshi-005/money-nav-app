# /api/test/generate-news-article

開発環境専用のニュース解説記事生成テストAPI。

本番の Cloud Scheduler は OIDC トークンで認証するため、ローカルでは呼び出せない。
このエンドポイントは `CRON_SECRET` で認証し、同等の記事生成を手動で実行できる。

## 前提条件

`.env.local` に以下が設定されていること：

```
CRON_SECRET=your-cron-secret
GEMINI_API_KEY=your-gemini-api-key
NEWS_API_KEY=your-news-api-key
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 使用方法

### 今日の記事を生成（JST 基準）

```bash
curl -X POST http://localhost:3000/api/test/generate-news-article \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -d '{}'
```

### 特定日付の記事を生成

```bash
curl -X POST http://localhost:3000/api/test/generate-news-article \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -d '{"date": "2026-02-21"}'
```

## リクエストボディ（全てオプション）

| フィールド | 型       | デフォルト | 説明                         |
|----------|---------|----------|------------------------------|
| `date`   | string  | JST 今日  | 対象日付（YYYY-MM-DD 形式）   |

## レスポンス例

### 成功時

```json
{
  "message": "News article generated successfully",
  "date": "2026-02-21",
  "article": {
    "title": "日銀が追加利上げを決定、円相場は上昇",
    "theme": "金融政策"
  }
}
```

### スキップ時（ニュース0件）

```json
{
  "message": "No news articles available for this date, skipping",
  "date": "2026-02-21",
  "skipped": true
}
```

## 確認手順

1. 開発サーバーを起動: `cd web && pnpm dev`
2. curl でリクエストを送信
3. ブラウザで確認:
   - 一覧: http://localhost:3000/news-articles
   - 詳細: http://localhost:3000/news-articles/2026-02-21
