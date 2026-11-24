# ロギングベストプラクティス

本プロジェクトにおけるCloud Logging対応のロギング実装のベストプラクティスをまとめたドキュメントです。

## 📋 目次

- [基本的な使い方](#基本的な使い方)
- [module命名規則](#module命名規則)
- [エラー分類](#エラー分類)
- [推奨パターン](#推奨パターン)
- [避けるべきパターン](#避けるべきパターン)

---

## 基本的な使い方

### 1. logger のインポート

```typescript
import { logger, logError } from "@/shared/lib/logger"
import { LOG_MODULES } from "@/shared/lib/log-modules"
```

### 2. 情報ログ

```typescript
logger.info("処理完了", {
  module: LOG_MODULES.API.CRON_PREDICTION,
  itemsProcessed: result.length,
  duration: Date.now() - startTime,
})
```

### 3. 警告ログ

```typescript
logger.warn("API リトライ", {
  module: LOG_MODULES.LIB.GEMINI_RETRY,
  attemptNumber: 2,
  maxAttempts: 3,
  reason: "Rate limit exceeded",
})
```

### 4. エラーログ（基本）

```typescript
logger.error("処理名エラー", {
  module: LOG_MODULES.API.DIAGNOSIS,
  action: "詳細なアクション説明",
  error: error instanceof Error ? error.message : String(error),
  ...(error instanceof Error && {
    stack: error.stack?.split("\n").slice(0, 5).join("\n"),
  }),
})
```

### 5. エラーログ（分類付き）🆕

```typescript
logError(
  "Supabase query failed",
  error,
  "database",
  { module: LOG_MODULES.API.DIAGNOSIS }
)
```

---

## module命名規則

`LOG_MODULES` 定数を使用してタイプセーフにモジュール名を指定します。

### 利用可能なモジュール

正本は [`web/src/shared/lib/log-modules.ts`](../../web/src/shared/lib/log-modules.ts) です。機能の追加や撤去に合わせてこのファイルが変わるので、一覧はそちらを見てください。ここでは代表的なものだけを挙げます。

```typescript
LOG_MODULES.API.CRON_PREDICTION        // "api/cron/generate-prediction"
LOG_MODULES.API.CRON_SEO_DATA          // "api/cron/collect-seo-data"
LOG_MODULES.API.DIAGNOSIS              // "api/diagnosis"
LOG_MODULES.LIB.GEMINI_RETRY           // "lib/gemini/retry"
LOG_MODULES.LIB.GEMINI_QUIZ_JUDGE      // "lib/gemini/quiz/judge" — LLM-as-a-Judge
LOG_MODULES.LIB.SLACK                  // "lib/slack"
LOG_MODULES.FEATURES.AUTH              // "features/auth"
LOG_MODULES.APP.LAYOUT                 // "app/layout"
```

グループは `API`・`LIB`・`FEATURES`・`COMPONENTS`・`VIEWS`・`APP` の6つです。`LIB` の値は、`src/lib` を撤廃する前の名前（`lib/...`）のまま残しています。

### メリット

- ✅ IDE補完が効く
- ✅ タイポ防止
- ✅ グローバルサーチで全ログ箇所を把握可能
- ✅ Cloud Loggingでの検索性向上

---

## エラー分類

`logError()` 関数を使うと、エラーの分類（`errorCategory`）をログに付けられます。分類は呼び出し側が第3引数で指定します。自動で決まるのは、分類から導かれる `isUserError`（`validation`・`notFound`・`rateLimit` なら `true`）だけです。

### エラーカテゴリ一覧

| カテゴリ | 説明 | HTTPステータス | isUserError |
|---------|------|---------------|-------------|
| `validation` | ユーザー入力エラー | 400 | `true` |
| `notFound` | リソース未発見 | 404 | `true` |
| `authentication` | 認証失敗 | 401 | `false` |
| `authorization` | 権限不足 | 403 | `false` |
| `rateLimit` | レート制限 | 429 | `true` |
| `external` | 外部APIエラー | N/A | `false` |
| `database` | DB接続エラー | N/A | `false` |
| `internal` | 予期しないエラー | 500 | `false` |

### 使用例

#### ユーザー入力エラー

```typescript
logError(
  "Invalid quiz answer format",
  error,
  "validation",
  { module: LOG_MODULES.API.QUIZ, userId: user.id }
)
```

#### 外部API呼び出しエラー

```typescript
logError(
  "Gemini API call failed",
  error,
  "external",
  {
    module: LOG_MODULES.LIB.GEMINI_RETRY,
    attemptNumber: 2,
  }
)
```

#### データベースエラー

```typescript
logError(
  "Supabase query failed",
  error,
  "database",
  {
    module: LOG_MODULES.API.DIAGNOSIS,
    query: "select from users",
  }
)
```

### Cloud Loggingでの活用

エラーカテゴリを使用すると、以下のようなクエリが可能になります（Logging のクエリ言語。SQL ではありません）：

```text
-- ユーザーエラーを除外してシステムエラーのみを取得
resource.type="cloud_run_revision"
jsonPayload.context.isUserError=false
severity="ERROR"

-- データベースエラーのみを取得
resource.type="cloud_run_revision"
jsonPayload.context.errorCategory="database"
severity="ERROR"
```

`logError` は、利用者起因のエラー（`validation` など）も重大度 ERROR で出力します。`severity="ERROR"` だけを条件にしたアラートは入力ミスでも鳴るので、アラートの条件に `jsonPayload.context.isUserError=false` を加えると、不要な通知を減らせます。

> 📝 **フィールド名の違い**: 下の「エラーログの標準形式」（`logger.error` で直接書く形）はエラーの内容を `error`・`stack` に入れ、`logError` は `errorMessage`・`errorStack` に入れます。エラーの内容で検索するときは、どちらで出力されたログかに合わせて `jsonPayload.context.error` と `jsonPayload.context.errorMessage` を使い分けてください。

---

## 推奨パターン

### ✅ エラーログの標準形式

```typescript
logger.error("処理名エラー", {
  module: LOG_MODULES.XXX,
  action: "詳細なアクション説明",
  error: error instanceof Error ? error.message : String(error),
  ...(error instanceof Error && {
    stack: error.stack?.split("\n").slice(0, 5).join("\n"),
  }),
})
```

### ✅ 情報ログの標準形式

```typescript
logger.info("処理完了", {
  module: LOG_MODULES.XXX,
  itemsProcessed: result.length,
  duration: Date.now() - startTime,
})
```

### ✅ 警告ログの標準形式

```typescript
logger.warn("API リトライ", {
  module: LOG_MODULES.XXX,
  attemptNumber: 2,
  maxAttempts: 3,
  reason: "Rate limit exceeded",
})
```

### ✅ パフォーマンスメトリクスの記録

```typescript
const startTime = Date.now()

try {
  const result = await processData()

  logger.info("処理完了", {
    module: LOG_MODULES.API.CRON_PREDICTION,
    duration: Date.now() - startTime,
    itemsProcessed: result.length,
    apiCallCount: 1,
  })
} catch (error) {
  logError(
    "処理失敗",
    error,
    "external",
    {
      module: LOG_MODULES.API.CRON_PREDICTION,
      duration: Date.now() - startTime,
    }
  )
}
```

---

## 避けるべきパターン

### ❌ テンプレートリテラルでエラー埋め込み

```typescript
// 悪い例
logger.error(`エラー: ${error}`, { module: "..." })

// 良い例
logger.error("エラー", {
  module: LOG_MODULES.XXX,
  error: error instanceof Error ? error.message : String(error),
})
```

### ❌ スタックトレース全体の出力

```typescript
// 悪い例（スタック全体でログが肥大化する）
logger.error("...", {
  stack: error.stack,
})

// 良い例（5行に制限）
logger.error("...", {
  ...(error instanceof Error && {
    stack: error.stack?.split("\n").slice(0, 5).join("\n"),
  }),
})
```

### ❌ センシティブ情報の記録

```typescript
// 絶対禁止
logger.error("認証失敗", {
  email: user.email,        // PII
  password: input.password, // 機密情報
  apiKey: process.env.API_KEY, // シークレット
})

// 良い例
logger.error("認証失敗", {
  module: LOG_MODULES.FEATURES.AUTH,
  userId: user.id, // 識別子のみ
})
```

### ❌ module なし

```typescript
// 悪い例（どこからのログか不明）
logger.error("エラー", { error: "..." })

// 良い例
logger.error("エラー", {
  module: LOG_MODULES.XXX,
  error: "...",
})
```

### ❌ 文字列リテラルでmodule指定

```typescript
// 悪い例（タイポのリスク、IDE補完が効かない）
logger.error("エラー", { module: "gemini" })

// 良い例
logger.error("エラー", { module: LOG_MODULES.LIB.GEMINI_RETRY })
```

---

## セキュリティガイドライン

### contextに含めてはいけない情報

- ❌ APIキー、トークン、パスワード
- ❌ ユーザーの個人情報（メールアドレス、氏名）
- ❌ クレジットカード情報
- ❌ セッションID、JWT

### スタックトレースの制限

スタックトレースを含める場合は、ログの量を抑えるため**最初の5行のみに制限**してください。Node.js のスタックトレースに環境変数は含まれませんが、1行目のエラーメッセージには機密（接続文字列など）が混ざることがあり、5行に絞っても残る点に注意してください。

```typescript
...(error instanceof Error && {
  stack: error.stack?.split("\n").slice(0, 5).join("\n"),
})
```

---

## Cloud Loggingでの検索例

> 📝 このサービスのログは、2026-08-18 のサービス終了と、`_Default` バケットの保持期間（30日）によって既に消えています。以下は書き方の例です。

ログエクスプローラで使う **Logging のクエリ言語**は、絞り込み専用の言語です。SQL ではないので、コードブロックは `text` にしています。

### モジュール別に検索

```text
resource.type="cloud_run_revision"
jsonPayload.context.module="api/cron/generate-prediction"
```

### エラーカテゴリ別に検索

```text
resource.type="cloud_run_revision"
jsonPayload.context.errorCategory="database"
severity="ERROR"
```

### システムエラーのみを検索（ユーザーエラーを除外）

```text
resource.type="cloud_run_revision"
jsonPayload.context.isUserError=false
severity="ERROR"
```

### パフォーマンスメトリクスの集計

Logging のクエリ言語はパイプや集計に対応していません（`| stats` は AWS の CloudWatch Logs Insights などの書き方です）。集計は **Log Analytics の SQL** で行います。Log Analytics では列名が `json_payload` になり、JSON の値は `JSON_VALUE` で文字列として取り出して、数値に変換してから計算します。

```sql
SELECT
  AVG(SAFE_CAST(JSON_VALUE(json_payload.context.duration) AS INT64)) AS avg_duration,
  MAX(SAFE_CAST(JSON_VALUE(json_payload.context.duration) AS INT64)) AS max_duration,
  COUNT(*) AS request_count
FROM `PROJECT_ID.LOCATION.BUCKET_ID.LOG_VIEW_ID`
WHERE JSON_VALUE(json_payload.context.module) = 'api/cron/generate-prediction'
```

使い方は [Cloud Logging 学習ガイド](./CLOUD_LOGGING.md) の Log Analytics の節を参照してください。

---

## 参考資料

- [Google Cloud Logging - Structured Logging](https://cloud.google.com/logging/docs/structured-logging)
- [Cloud Logging 学習ガイド](./CLOUD_LOGGING.md)
- [logger.ts ソースコード](../../web/src/shared/lib/logger.ts)
- [LOG_MODULES 定義](../../web/src/shared/lib/log-modules.ts)
