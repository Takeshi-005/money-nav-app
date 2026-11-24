# システム構成

AI投資パートナーのシステムアーキテクチャを説明します。

> ⚠️ **サービス終了に伴い、2026-08-18 に GCP リソース（Cloud Run・Scheduler など）を削除済みです。** また、本書の画面一覧・処理フロー・コード例の多くは初期設計のままで、その後の機能の入れ替え（クイズ → 予測トレーニング、市場解説の撤去など）を反映していません。2026-09-24 に、GCP の仕様に関わる記述と明確な誤りだけを訂正しました。現在の構成は [README](../../README.md) を参照してください。

---

## 💡 この設計から学べること

- **サーバーレスアーキテクチャ**の設計パターン
- **無料枠内でサービス運用**するための工夫
- **Next.js App Router**を活用したフルスタック開発
- **AI API（Gemini）の効率的な利用**方法
- **バッチ処理とリアルタイム処理**の使い分け

---

## 設計方針

| 項目 | 方針 | 理由 |
|------|------|------|
| コスト | GCP無料枠内で運用 | 個人開発・スタートアップでは初期コストを抑えることが重要 |
| 運用負荷 | サーバーレスで自動スケール | サーバー管理が不要、アクセスがない時は課金されない |
| 開発効率 | Next.js で一元管理 | フロント・バックエンドを同一言語・同一リポジトリで開発 |

### 📚 学習ポイント: なぜサーバーレス？

従来のサーバー型と比較すると：

```
【従来型】常時起動サーバー
- EC2/GCE に24時間起動
- 月額: 数千円〜
- アクセスがなくても課金

【サーバーレス】Cloud Run
- アクセス時のみ起動
- 月額: ¥0〜100（無料枠内）
- アクセスがなければ¥0
```

**トレードオフ**: コールドスタート（初回アクセスに2〜3秒かかる）がありますが、コスト削減のメリットが大きい。

---

## システム概要図

```
┌─────────────────────────────────────────────────────────────┐
│                        ユーザー                              │
│                    （ブラウザ / モバイル）                     │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloud Run                                 │
│                 （Next.js アプリケーション）                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Web UI (React Server Components)                       │ │
│  │  ├── / (ランディングページ)                             │ │
│  │  ├── /login (ログイン)                                  │ │
│  │  ├── /dashboard (ダッシュボード)                        │ │
│  │  ├── /diagnosis (投資スタイル診断)                      │ │
│  │  ├── /quiz (デイリークイズ)                             │ │
│  │  ├── /market-insights (市場解説)                        │ │
│  │  └── /news-articles (ニュース解説記事)                  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ API Routes (Route Handlers)                            │ │
│  │  ├── /api/diagnosis (AI診断実行)                        │ │
│  │  ├── /api/quiz (クイズ取得・回答送信)                   │ │
│  │  ├── /api/market-analysis (市場解説)                    │ │
│  │  ├── /api/cron/generate-quiz (クイズ生成バッチ)         │ │
│  │  ├── /api/cron/generate-market-analysis (市場解説生成バッチ) │ │
│  │  ├── /api/cron/generate-news-article (ニュース解説記事生成バッチ) │ │
│  │  ├── /api/sync (データ同期)                             │ │
│  │  └── /api/health (ヘルスチェック)                       │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────┬─────────────────────┬──────────────┬────────────┘
            │                     │              │
     [認証・DB]               [AIモデル]      [通知]
            │                     │              │
            ▼                     ▼              ▼
┌─────────────────────┐   ┌─────────────┐  ┌───────────────┐
│ Supabase Auth       │   │ Vertex AI   │  │ Slack         │
│ (Google認証)         │   │ (Gemini     │  │ (Incoming     │
├─────────────────────┤   │  2.5 Flash) │  │  Webhook)     │
│ Supabase DB         │   │ - 診断生成  │  │               │
│ (データベース)        │   │ - クイズ生成│  │ ← ニュース記事 │
└─────────────────────┘   │ - 記事生成  │  │   生成完了通知 │
            ▲              └─────────────┘  └───────────────┘
            │
┌─────────────────────┐
│ Cloud Scheduler     │
│ (JST・全ジョブ停止中) │
│                     │
│ 毎日 09:00 → /api/cron/generate-prediction │
│ 日曜 00:00 → /api/cron/generate-glossary-terms │
│ 月曜 09:00 → /api/cron/collect-seo-data │
└─────────────────────┘
```

---

## 技術スタック詳細

### フロントエンド / バックエンド

| 項目 | 選定 | 理由 |
|------|------|------|
| フレームワーク | Next.js 16 (App Router) | フロント・APIを単一コードベースで管理 |
| 言語 | TypeScript | 型安全性、開発効率 |
| スタイリング | Tailwind CSS 4 | ユーティリティファースト |
| チャート | Chart.js + react-chartjs-2 | 学習進捗の可視化 |

### 📚 学習ポイント: なぜ Next.js App Router？

```
【Pages Router（従来）】
- pages/api/xxx.ts にAPIを配置
- getServerSideProps でサーバーサイドレンダリング

【App Router（最新）】
- app/api/xxx/route.ts にAPIを配置（Route Handlers）
- Server Components でデフォルトSSR
- サーバー・クライアントの境界が明確
```

**メリット**:
1. `use client` を書かない限りサーバーで実行 → バンドルサイズ削減
2. API Route と UI が同じディレクトリ構造 → 理解しやすい
3. Streaming SSR でパフォーマンス向上

### インフラストラクチャ

| 項目 | 選定 | 理由 |
|------|------|------|
| ホスティング | Cloud Run | サーバーレス、自動スケール、無料枠大 |
| スケジューラー | Cloud Scheduler | 定期実行トリガー。請求先アカウントあたり月3ジョブまで無料（一時停止中のジョブも数える） |
| コンテナレジストリ | Artifact Registry | Docker イメージ管理 |
| IaC | Terraform | インフラのコード化、再現性 |

### 📚 学習ポイント: Cloud Run vs Cloud Functions

```
【Cloud Run functions（旧 Cloud Functions）】
- 関数単位でデプロイ（ソースを渡すと、コンテナのビルドは Google が行う）
- 2024年に Cloud Functions から改名。第2世代以降は Cloud Run の上で動く
- コールドスタートは Cloud Run と同じ仕組みで起きる（関数だから速いわけではない）
- 1つの関数に1つの処理を書く形なので、Next.js のようなアプリ全体には向かない

【Cloud Run】
- コンテナ単位でデプロイ
- Next.js 等のフレームワークをそのまま動かせる
- 柔軟性が高い
```

このプロジェクトでは Next.js をそのまま動かしたいので **Cloud Run** を選択。

### データストア

| 項目 | 選定 | 理由 |
|------|------|------|
| データベース | Supabase（PostgreSQL） | JSONB 列で AI 出力の JSON をそのまま保存でき、RLS で行単位の権限も付けられる |
| 認証 | Supabase Auth | Google認証が容易、無料 |

### 📚 学習ポイント: Supabase は RDB（PostgreSQL）

```
【Supabase の正体】
- PostgreSQL（リレーショナルデータベース）に、認証・API・RLS をまとめたサービス
- スキーマ（テーブル定義）がある。変更は docs/database/migrations/ の SQL で管理している
- JSONB 列を使えば、AI が返す JSON をそのまま保存・検索できる
- 課金はプラン（容量・計算資源）ベース。読み取り回数で課金されるのは Firestore の方式
```

AI（Vertex AI / Gemini）が返すJSON形式のデータは、PostgreSQL の **JSONB 列**に保存しています。NoSQL を選んだわけではありません。

---

## 主要フロー

### 1. 投資スタイル診断フロー

```
ユーザー
    │
    │ 1. 診断フォーム入力
    ▼
/diagnosis (ページ)
    │
    │ 2. POST /api/diagnosis
    ▼
API Route
    │
    │ 3. diagnosis_cache を確認（answer_key で照合）
    ├─ キャッシュHIT  → 5. クライアントに返却（Gemini呼び出しなし）
    │
    │ キャッシュMISS
    │ 4. Gemini APIにプロンプト送信
    ▼
Gemini API
    │
    │ 診断結果JSON返却
    ▼
API Route
    │
    │ 5. diagnosis_cache に保存
    │ 6. Supabaseに結果保存（認証済みユーザーのみ）
    │ 7. クライアントに返却
    ▼
/diagnosis (ページ)
    │
    │ 8. 結果表示
    ▼
ユーザー
```

### 📚 実装ポイント: プロンプトエンジニアリング

診断APIで使用するプロンプトの例：

```typescript
// 初期設計のプロンプト例（実装は web/src/shared/api/gemini/diagnosis/prompt.ts）
const DIAGNOSIS_PROMPT = `
あなたはベテランの投資アドバイザーです。
以下のユーザー情報に基づき、投資スタイルを診断してください。

ユーザー情報:
${JSON.stringify(userInput)}

以下のJSON形式で回答してください:
{
  "style": "投資スタイル名",
  "description": "スタイルの説明（100文字程度）",
  "recommendedSectors": ["セクター1", "セクター2"],
  "suggestedTickers": [
    {"code": "銘柄コード", "name": "銘柄名", "reason": "推奨理由"}
  ]
}

注意:
- 売買の推奨は行わず、特徴の紹介に留めてください
- 投資初心者にもわかりやすい言葉で説明してください
`;
```

### 2. デイリークイズ生成フロー（バッチ）

```
Cloud Scheduler (毎日 7:00 JST)
    │
    │ 1. HTTP POST トリガー
    ▼
/api/cron/generate-quiz
    │
    │ 2. OIDC トークン検証（当初は CRON_SECRET。後述の「API保護」）
    │
    │ 3. ニュースRSS取得
    ▼
ニュースソース (Yahoo Finance等)
    │
    │ 4. ニュース記事
    ▼
/api/cron/generate-quiz
    │
    │ 5. Gemini APIにクイズ生成依頼
    ▼
Gemini API
    │
    │ 6. クイズJSON
    ▼
/api/cron/generate-quiz
    │
    │ 7. Supabase daily_quizzes に保存
    ▼
Supabase
```

### 📚 設計判断: なぜバッチ処理？

```
【リアルタイム生成の場合】
ユーザーがクイズを開くたびにGemini APIを呼ぶ
→ Vertex AI はトークン数に応じた従量課金（無料枠なし）なので、
  アクセス数に比例して費用が増える

【バッチ処理の場合】
毎朝1回だけGemini APIを呼んでDBに保存
→ 何人がアクセスしてもAPI呼び出しは1回
```

**結論**: コスト削減のため、クイズは**毎朝バッチで「作り置き」する**。

### 3. ニュース解説記事生成フロー（バッチ）

```
Cloud Scheduler (毎日 7:00 JST)
    │
    │ 1. HTTP POST トリガー
    ▼
/api/cron/generate-news-article
    │
    │ 2. OIDC トークン検証
    │ 3. 同日記事の存在チェック（重複スキップ）
    │
    │ 4. NewsAPI からニュース取得（最大10件）
    ▼
NewsAPI.org
    │
    │ 5. ニュース記事
    ▼
/api/cron/generate-news-article
    │
    │ 6. Gemini API で初心者向け解説記事を生成
    ▼
Vertex AI (Gemini 2.5 Flash)
    │
    │ 7. 記事JSON
    ▼
/api/cron/generate-news-article
    │
    │ 8. news_articles テーブルに保存（upsert）
    │ 9. Slack に記事URL + Xポスト用テキストを通知
    ▼
Supabase / Slack
```

### 📚 設計判断: Slack 通知の役割

```
【通知に含まれる情報】
- 記事URL: 生成結果をすぐ確認できる
- Xポスト用テキスト: SNS拡散を省力化

【通知タイミング】
- 記事保存成功後に送信
- 通知失敗はログに残すが、バッチ全体はエラーにしない
  （Slack障害でニュース記事生成が止まらないようにする）
```

---

### 4. クイズ回答フロー

```
ユーザー
    │
    │ 1. /quiz にアクセス
    ▼
/quiz (ページ)
    │
    │ 2. GET /api/quiz (今日のクイズ取得)
    ▼
API Route
    │
    │ 3. Supabase から daily_quizzes/{今日} を取得
    ▼
/quiz (ページ)
    │
    │ 4. クイズ表示
    │ 5. ユーザー回答
    │
    │ 6. POST /api/quiz (回答送信)
    ▼
API Route
    │
    │ 7. 正誤判定
    │ 8. 経験値更新 (users/{uid})
    │ 9. 履歴保存 (quiz_history/{date})
    ▼
/quiz (ページ)
    │
    │ 10. 結果・解説表示
    ▼
ユーザー
```

---

## セキュリティ

### 認証

- Supabase Auth によるGoogle認証
- API Route では `supabase.auth.getUser()` でユーザーを検証する（`getServerSession()` は NextAuth の関数で、本プロジェクトでは使っていない）
- 未認証ユーザーが `/dashboard` にアクセスすると `/login` にリダイレクト（`/diagnosis` と `/quiz` は未ログインでも使える）

### 📚 実装ポイント: ミドルウェアでの認証チェック

```typescript
// web/src/middleware.ts（要点だけに絞った抜粋）
export async function middleware(request: NextRequest) {
  // Supabase のセッション（Cookie）を検証・更新する
  const supabase = createServerClient(/* URL・anon key・Cookie の読み書き */)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  return supabaseResponse
}

export const config = {
  matcher: ["/article/:path*", "/dashboard/:path*", "/login"],
}
```

### API保護

- `/api/cron/*` は、Cloud Scheduler が付ける OIDC トークン（`Authorization: Bearer …`）をアプリで検証する
- トークンの署名を Google の公開鍵で確かめ、発行元の SA が `api-scheduler` であることを確認する
- Cloud Run は `allUsers` に公開しているので、Cloud Run の IAM はリクエストを止めない。門番はこのアプリ側の検証
- 以前は `CRON_SECRET` を共有する方式だったが、値が tfstate に平文で残る問題があり移行した（[移行の記録](../issues/CLOUD_SCHEDULER_OIDC_MIGRATION.md)）

### 📚 実装ポイント: OIDC トークン検証

```typescript
// app/api/cron/generate-prediction/route.ts（抜粋）
import { verifySchedulerToken } from "@/shared/lib/verify-scheduler-token"

export async function POST(request: Request) {
  const isValid = await verifySchedulerToken(request.headers.get("authorization"))
  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 予測トレーニングの生成処理...
}
```

---

## スケーリング

### Cloud Run 設定

| 項目 | 設定値 | 理由 |
|------|--------|------|
| min-instances | 0 | コスト最小化（コールドスタート許容） |
| max-instances | 2 | 同時に処理する量を抑える（1台あたり最大80件なので計160件）。請求額の上限ではない |
| CPU | 1 | 軽量な処理 |
| メモリ | 512Mi | Next.js SSR に十分 |

### 📚 学習ポイント: min-instances のトレードオフ

```
【min-instances = 0】
- アイドル時は¥0
- 初回アクセスに2〜3秒かかる（コールドスタート）
- 個人開発・低トラフィックサービス向け

【min-instances = 1】
- 常時1インスタンス起動 → 月額数百円
- 常に高速レスポンス
- 商用サービス向け
```

### Vertex AI 制限

| 項目 | Vertex AI |
|------|-----------|
| クォータ | 動的共有クォータ。プロジェクトごとの固定の RPM・日次上限はない |
| 混雑時 | 共有の処理能力が足りないと 429 が返る（Quotas 画面での引き上げ申請はできない） |
| 課金モデル | 従量課金（トークン単位） |

### 📚 対策: コスト最適化の設計

1. **バッチ処理**: クイズは毎朝1回生成してDBに保存
2. **診断キャッシュ**: 回答パターン単位で `diagnosis_cache` にキャッシュ。同一回答は Vertex AI 呼び出しをスキップ
3. **軽量モデル**: `gemini-2.5-flash` を使用（高速・低コスト）

---

## よくある質問

### Q: なぜ Vercel ではなく Cloud Run？

**A**: 以下の理由で Cloud Run を選択：
- GCP の他サービス（Scheduler, Vertex AI, Secret Manager）との連携が容易
- Terraform で一元管理できる
- 無料枠が大きい（200万リクエスト/月）

### Q: データベースは PostgreSQL でも良い？

**A**: Supabase 自体が PostgreSQL です。AI が返す JSON は JSONB 列に保存しているので、スキーマのある RDB でも柔軟に扱えます。

### Q: 認証を自前実装しないのはなぜ？

**A**: セキュリティリスクを避けるため。Supabase Auth は：
- パスワード管理不要
- OAuth フローを自動処理
- セッション管理も標準機能

---

## 関連ドキュメント

- [データベース設計](./DATABASE.md) - スキーマ定義と設計判断
- [環境変数](../setup/SECRETS.md) - 必要な環境変数一覧
- [CI/CD](../deployment/CICD.md) - 自動デプロイの仕組み
