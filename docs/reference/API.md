# API リファレンス

REST API エンドポイントの仕様です。

> ⚠️ **サービス終了に伴い、2026-08-18 に Cloud Run・Cloud Scheduler などの GCP リソースを削除済みです。** 本書は稼働していた頃の仕組みを学ぶ資料として残しています。経緯は [docs/shutdown/SHUTDOWN_CHECKLIST.md](../shutdown/SHUTDOWN_CHECKLIST.md) を参照してください。

---

## 💡 このリファレンスから学べること

- **REST API** の設計パターン
- **HTTPメソッド** の使い分け
- **エラーハンドリング** のベストプラクティス
- **認証付きAPI** の実装方法

---

## エンドポイント一覧

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | `/api/health` | 不要 | ヘルスチェック |
| POST | `/api/diagnosis` | 不要 | AI投資スタイル診断 |
| GET | `/api/diagnosis` | 必要 | 過去の診断結果取得 |
| GET | `/api/quiz` | 不要 | 今日のクイズ取得 |
| POST | `/api/quiz` | 不要 | クイズ回答送信 |
| GET | `/api/quiz/history` | 不要 | クイズ履歴・統計取得 |
| GET | `/api/market-analysis` | 不要 | 市場解説取得 |
| POST | `/api/cron/generate-market-analysis` | Cloud Scheduler OIDC | 市場解説生成バッチ |
| POST | `/api/cron/generate-quiz` | Cloud Scheduler OIDC | クイズ生成（バッチ） |
| POST | `/api/cron/generate-news-article` | Cloud Scheduler OIDC | ニュース解説記事生成バッチ |
| POST | `/api/sync` | 必要 | データ同期 |
| POST | `/api/test/generate-news-article` | CRON_SECRET (開発環境のみ) | ニュース解説記事生成テスト |
| POST | `/api/test/slack-notification` | CRON_SECRET (開発環境のみ) | Slack通知テスト |

> 📝 上の表は初期設計のままです。`/api/cron/generate-quiz`・`/api/cron/generate-market-analysis`・`/api/market-analysis` は撤去済みです。Cloud Scheduler から呼ばれていた cron は次のとおりで、いずれも Cloud Scheduler の OIDC トークンで保護しています。

| パス | Scheduler のジョブ | スケジュール（JST） |
|------|--------------------|---------------------|
| `/api/cron/generate-prediction` | `prediction-generator` | 毎日 09:00 |
| `/api/cron/generate-glossary-terms` | `glossary-generator` | 日曜 00:00 |
| `/api/cron/collect-seo-data` | `seo-data-collector` | 月曜 09:00 |
| `/api/cron/generate-news-article` | なし（日次生成は停止済み） | - |

---

## 共通仕様

### レスポンス形式

```json
{
  "data": { ... },      // 成功時のデータ
  "error": "string",    // エラーメッセージ
  "details": "string"   // エラー詳細（開発用）
}
```

### HTTPステータスコード

| コード | 意味 | 使用例 |
|--------|------|--------|
| 200 | 成功 | データ取得成功 |
| 201 | 作成成功 | リソース作成成功 |
| 400 | バリデーションエラー | 必須パラメータ不足 |
| 401 | 認証エラー | 未ログイン |
| 403 | 権限エラー | アクセス権なし |
| 404 | リソースなし | データが見つからない |
| 500 | サーバーエラー | 内部エラー |

### 📚 学習ポイント: HTTPメソッドの使い分け

```
GET    - データ取得（副作用なし）
POST   - データ作成、処理実行
PUT    - データ全体の更新
PATCH  - データ部分更新
DELETE - データ削除
```

---

## ヘルスチェック

### GET /api/health

サーバーの稼働状態を確認します。

#### リクエスト

```bash
curl https://your-domain.com/api/health
```

#### レスポンス

```json
{
  "status": "ok",
  "timestamp": "2026-01-13T10:00:00.000Z"
}
```

#### 用途

- Cloud Run の startup プローブと liveness プローブ（`terraform/cloud-run.tf`）
- CI/CD デプロイ後の確認（`deploy.yml` の Verify deployment）

---

## AI投資スタイル診断

### POST /api/diagnosis

ユーザーの入力に基づいてAIが投資スタイルを診断します。同一回答パターンは `diagnosis_cache` テーブルから返却し、Gemini API 呼び出しをスキップします。

#### リクエスト

```bash
curl -X POST https://your-domain.com/api/diagnosis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "investmentRegion": "japan",
    "investmentPeriod": "long",
    "playStyle": "dividend",
    "riskTolerance": "low",
    "budget": "500000",
    "purpose": "retirement"
  }'
```

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `investmentRegion` | string | ✓ | `japan` / `us` |
| `investmentPeriod` | string | ✓ | `short` / `medium` / `long` |
| `playStyle` | string | ✓ | `growth` / `dividend` |
| `riskTolerance` | string | ✓ | `low` / `medium` / `high` |
| `budget` | string | ✓ | `100000` / `500000` / `1000000` / `more` |
| `purpose` | string | ✓ | `retirement` / `hobby` / `learning` / `fire` |
| `sectors` | string[] | | 興味のあるセクター |

#### レスポンス（成功）

```json
{
  "style": "堅実な守り手タイプ",
  "description": "リスクを抑えつつ、着実に資産を増やしたいあなたにぴったりのスタイルです。",
  "recommendedSectors": ["ヘルスケア", "生活必需品", "公益事業"],
  "suggestedTickers": [
    {
      "code": "PG",
      "name": "P&G",
      "reason": "65年連続増配の配当王"
    },
    {
      "code": "9433",
      "name": "KDDI",
      "reason": "株主優待と安定配当が魅力"
    }
  ]
}
```

#### レスポンス（エラー）

```json
{
  "error": "Validation failed",
  "details": "investmentRegion is required"
}
```

---

## クイズ取得

### GET /api/quiz

今日のデイリークイズを取得します。

#### リクエスト

```bash
curl https://your-domain.com/api/quiz \
  -H "Authorization: Bearer {token}"
```

#### レスポンス（成功）

```json
{
  "date": "2026-01-13",
  "newsSource": "ロイター通信",
  "newsTitle": "米CPI発表、市場予想を上回る",
  "newsSummary": "米国の消費者物価指数が前年同月比3.5%上昇し、市場予想の3.2%を上回った。",
  "targetSector": "ハイテク株",
  "quizQuestion": "金利上昇懸念となるこのニュースは、ハイテク株にとってどう判断される？",
  "options": [
    {"id": 1, "text": "ポジティブ（株価上昇要因）"},
    {"id": 2, "text": "ネガティブ（株価下落要因）"},
    {"id": 3, "text": "影響なし"}
  ],
  "answered": false
}
```

#### 📚 学習ポイント: 正解を隠す

```typescript
// APIレスポンスで正解を返さない
const { correct_option_id, ...quiz } = data
return NextResponse.json(quiz)

// 正解は回答送信時にサーバー側で判定
```

#### レスポンス（クイズなし）

```json
{
  "error": "Quiz not found",
  "details": "No quiz available for today"
}
```

---

## クイズ回答

### POST /api/quiz

クイズの回答を送信します。

#### リクエスト

```bash
curl -X POST https://your-domain.com/api/quiz \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "quizDate": "2026-01-13",
    "selectedOptionId": 2
  }'
```

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `quizDate` | string | ✓ | クイズの日付（YYYY-MM-DD） |
| `selectedOptionId` | number | ✓ | 選択した選択肢ID |

#### レスポンス（成功）

```json
{
  "isCorrect": true,
  "correctOptionId": 2,
  "explanation": "金利が上がると、将来の利益を現在価値に割り引く際のレートが高くなり、成長期待で買われるハイテク株は割高と判断されやすくなります。",
  "gainedExp": 10,
  "newExperience": 360,
  "newLevel": 5,
  "leveledUp": false
}
```

#### レスポンス（既に回答済み）

```json
{
  "error": "Already answered",
  "details": "You have already answered today's quiz"
}
```

---

## クイズ生成（バッチ）

### POST /api/cron/generate-quiz

毎日のクイズを生成します。**Cloud Scheduler からのみ呼び出し可能。**

#### 認証

**Cloud Scheduler OIDC トークン**

Cloud SchedulerがGCPサービスアカウント `api-scheduler@{PROJECT_ID}.iam.gserviceaccount.com` の
OIDCトークンを自動付与します。手動でリクエストする場合は以下の手順が必要です。

```bash
# ローカルテスト用（gcloud IDトークン使用）
TOKEN=$(gcloud auth print-identity-token \
  --impersonate-service-account=api-scheduler@PROJECT_ID.iam.gserviceaccount.com \
  --audiences=CLOUD_RUN_URL \
  --include-email)
curl -X POST CLOUD_RUN_URL/api/cron/generate-quiz \
  -H "Authorization: Bearer $TOKEN"
```

- `--include-email` を付けないと、トークンに `email` クレームが入りません。アプリの `verifySchedulerToken` は `email` が `api-scheduler@…` であることを確かめるので、付け忘れると必ず 401 になります
- `api-scheduler` を借用してトークンを作るには、その SA に対する `roles/iam.serviceAccountTokenCreator` が必要です。Terraform はこの権限を付与していません（開発者に付与しているのは `cloud-run-app` の借用だけ）。プロジェクトの Owner ロールにも含まれないので、別途付与が必要です

#### レスポンス（成功）

```json
{
  "success": true,
  "date": "2026-01-13",
  "message": "Quiz generated successfully"
}
```

#### レスポンス（認証失敗・401）

```json
{
  "error": "Unauthorized"
}
```

---

## ニュース解説記事生成バッチ

### POST /api/cron/generate-news-article

毎日のニュースをAIが解説する記事を生成します。**Cloud Scheduler からのみ呼び出し可能。**

**認証**: Cloud Scheduler OIDC トークン（`api-scheduler` サービスアカウント）

#### 処理フロー

1. 同日記事が既に存在する場合はスキップ
2. NewsAPI から最新ニュースを最大10件取得
3. Gemini API で初心者向け解説記事を生成
4. `news_articles` テーブルに保存（upsert）
5. Slack へ記事URLと Xポスト用テキストを通知

#### レスポンス

**生成成功**:
```json
{
  "message": "News article generated successfully",
  "date": "2026-02-26",
  "article": {
    "title": "今日の市場を動かした3つのニュース",
    "theme": "金利と為替の攻防"
  }
}
```

**既存データあり（スキップ）**:
```json
{
  "message": "News article already exists for today",
  "date": "2026-02-26"
}
```

**ニュース取得失敗（スキップ）**:
```json
{
  "message": "No news articles available for this date, skipping",
  "date": "2026-02-26",
  "skipped": true,
  "reason": "No articles returned from NewsAPI"
}
```

---

## 開発用テストエンドポイント

> ⚠️ `NODE_ENV === "production"` の場合は **403** を返します。本番環境では使用不可。

### POST /api/test/generate-news-article

任意日付を指定してニュース解説記事の生成をテストします。AI生成を含むため実行に時間がかかります。

#### 認証

```
Authorization: Bearer {CRON_SECRET}
```

#### リクエストボディ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `date` | string | | 対象日付（YYYY-MM-DD）。省略時は JST 当日 |
| `overwrite` | boolean | | 既存データを上書きするか（デフォルト: false） |

#### 実行例（ローカル）

```bash
CRON_SECRET=$(grep CRON_SECRET web/.env | cut -d'=' -f2-)

curl -X POST http://localhost:3000/api/test/generate-news-article \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-02-26"}'
```

---

### POST /api/test/slack-notification

Supabase の最新 `news_articles` を1件取得して Slack に送信します。AI生成なし・最小コストで Slack Webhook の疎通確認ができます。

#### 認証

```
Authorization: Bearer {CRON_SECRET}
```

#### 実行例（ローカル）

```bash
CRON_SECRET=$(grep CRON_SECRET web/.env | cut -d'=' -f2-)

curl -X POST http://localhost:3000/api/test/slack-notification \
  -H "Authorization: Bearer $CRON_SECRET"
```

#### レスポンス（成功）

```json
{
  "message": "Slack notification sent successfully",
  "date": "2026-02-26"
}
```

#### レスポンス（記事なし）

```json
{
  "error": "No news articles found in database"
}
```

---

## データ同期

### POST /api/sync

ゲストユーザーのデータをログインユーザーに同期します。

#### リクエスト

```bash
curl -X POST https://your-domain.com/api/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "guestData": {
      "quizHistory": [...],
      "diagnosisResult": {...}
    }
  }'
```

#### レスポンス（成功）

```json
{
  "success": true,
  "syncedItems": {
    "quizHistory": 5,
    "diagnosisResult": 1
  }
}
```

---

## クイズ履歴取得

### GET /api/quiz/history

クイズ回答履歴と統計情報を取得します。

#### リクエスト

```bash
curl "https://your-domain.com/api/quiz/history?limit=7&detailed=true"
```

#### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `limit` | number | | 取得日数（省略時: 全件） |
| `detailed` | boolean | | 問題詳細を含めるか |

#### レスポンス（成功）

```json
{
  "history": [
    {
      "date": "2026-01-13",
      "answers": [
        { "quizType": "news", "isCorrect": true },
        { "quizType": "basic", "isCorrect": true },
        { "quizType": "scenario", "isCorrect": false }
      ],
      "correctCount": 2,
      "totalCount": 3
    }
  ],
  "stats": {
    "totalAnswered": 45,
    "correctCount": 38,
    "correctRate": 84.4,
    "streakDays": 5,
    "perfectDays": 3
  }
}
```

---

## 市場解説取得

### GET /api/market-analysis

最新の市場解説を取得します。

#### リクエスト

**クエリパラメータ**:
- `date` (optional): `YYYY-MM-DD` 形式の日付指定

```bash
# 最新の解説を取得
GET /api/market-analysis

# 特定日の解説を取得
GET /api/market-analysis?date=2026-01-29
```

#### レスポンス

**成功時 (200 OK)**:
```json
{
  "id": "uuid",
  "date": "2026-01-29",
  "nikkei_close": 35000.50,
  "nikkei_change_percent": -2.5,
  "analysis_content": {
    "summary": "米国株安と円高で日経平均が急落...",
    "factors": [
      {
        "category": "us_market",
        "title": "米国株の急落",
        "description": "S&P500が前日比-2.5%と大幅下落..."
      }
    ],
    "checklist": [
      {
        "question": "下落の原因は一時的なものか？",
        "guidance": "今回の下落は米国の利上げ観測...",
        "isWarningSign": false
      }
    ],
    "scenarios": {
      "bullish": {
        "title": "反発シナリオ",
        "description": "利上げ観測が後退すれば...",
        "conditions": ["米国のインフレ率が低下", "..."]
      },
      "bearish": {
        "title": "続落シナリオ",
        "description": "利上げが長期化すれば...",
        "conditions": ["インフレ率が高止まり", "..."]
      }
    },
    "beginnerAdvice": {
      "dos": ["冷静に状況を観察", "..."],
      "donts": ["パニック売りをしない", "..."]
    }
  },
  "created_at": "2026-01-29T16:30:00Z"
}
```

**エラー時 (404 Not Found)**:
```json
{
  "error": "指定された日付の解説が見つかりません"
}
```

---

## 市場解説生成バッチ

### POST /api/cron/generate-market-analysis

日経平均データを取得し、下落時に解説を自動生成します。

**認証**: Cloud Scheduler OIDC トークン（`api-scheduler` サービスアカウント）

#### 処理フロー

1. Yahoo Finance APIから日経平均データ取得
2. 前日比が-2.0%以上下落を判定
3. 下落時のみGemini API呼び出し
4. Supabaseに保存（upsert）

#### レスポンス

**下落時（解説生成）**:
```json
{
  "message": "Market analysis generated successfully",
  "date": "2026-01-29",
  "nikkeiData": {
    "close": 35000.50,
    "changePercent": -2.5
  },
  "analysis": {
    "summary": "米国株安と円高で...",
    "factorsCount": 4
  }
}
```

**下落なし（スキップ）**:
```json
{
  "message": "No analysis needed (not a significant decline)",
  "date": "2026-01-29",
  "changePercent": -0.5,
  "threshold": -2.0
}
```

**既存データあり**:
```json
{
  "message": "Analysis already exists for today",
  "date": "2026-01-29"
}
```

---

## 認証

### 📚 学習ポイント: Bearer トークン

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                      ↑ JWTトークン（Supabase が発行）
```

### クライアントでのトークン取得

**📚 学習ポイント**: 本プロジェクトでは `client()` ラッパーを使用してAPI呼び出しを行います。認証トークンは自動的に処理されます。

```typescript
// features/quiz-data/api/fetchQuizData.ts
import { client } from '@/shared/api'

// 認証が必要なAPIを呼び出し
// トークンは自動的にSupabase Clientから取得され、ヘッダーに含まれます
const data = await client<QuizDataResponse>('/api/quiz')
```

### サーバーでのトークン検証

```typescript
// app/api/quiz/route.ts
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // 認証済み処理...
}
```

---

## 関連ドキュメント

- [Next.js開発](../development/WEB.md) - API Route の実装方法
- [データベース設計](../architecture/DATABASE.md) - スキーマ定義
- [トラブルシューティング](./TROUBLESHOOTING.md) - よくあるエラー
