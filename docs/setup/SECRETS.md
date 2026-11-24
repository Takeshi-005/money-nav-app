# 環境変数・シークレット

必要な環境変数の一覧と取得方法です。

> ⚠️ **サービス終了に伴い、2026-08-18 に Secret Manager のシークレット・Cloud Run・GitHub Secrets を削除済みです。** 本書の「本番環境での設定」は、稼働していた頃の仕組みを学ぶ資料として残しています。経緯は [docs/shutdown/SHUTDOWN_CHECKLIST.md](../shutdown/SHUTDOWN_CHECKLIST.md) を参照してください。

---

## 💡 この設定から学べること

- **環境変数** のベストプラクティス
- **NEXT*PUBLIC* プレフィックス** の意味
- **Secret Manager** でのシークレット管理
- 各サービス（Supabase, Vertex AI, Firebase）の設定方法

---

## 環境変数一覧

### ローカル開発用（.env）

| 変数名                          | 必須 | 公開 | 説明                                     |
| ------------------------------- | ---- | ---- | ---------------------------------------- |
| `NEXT_PUBLIC_APP_URL`           | ✓    | ✓    | アプリケーションのベースURL（SEO/OGP用） |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✓    | ✓    | Supabase プロジェクトURL                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓    | ✓    | Supabase 公開キー                        |
| `SUPABASE_SERVICE_ROLE_KEY`     | ✓    | ✗    | Supabase サーバー用キー                  |
| `GCP_PROJECT_ID`                | ✓    | ✗    | Vertex AI + Cloud SchedulerのOIDCトークン検証用 |
| `GOOGLE_CLOUD_LOCATION`         | ✓    | ✗    | Vertex AI リージョン（本番: asia-northeast1。未設定時の既定値も同じ） |
| `SLACK_WEBHOOK_URL`             | ✓    | ✗    | Slack Incoming Webhook URL               |
| `CRON_SECRET`                   | ✓    | ✗    | 開発用テストエンドポイントの認証シークレット |

### 📚 学習ポイント: 公開キーの考え方

```
【公開キー（NEXT_PUBLIC_）】
- ブラウザに露出しても問題ないキー（ビルド時に JavaScript に埋め込まれる）
- できることは RLS（行単位のアクセス制御）の設定で決まる。読み取り専用とは限らない
- 例: Supabase ANON_KEY は RLS で保護されている

【非公開キー】
- サーバーサイドのみで使用
- 管理者権限を持つ
- 例: SERVICE_ROLE_KEY は RLS をバイパス
```

---

## 各サービスの設定方法

### 1. NEXT_PUBLIC_APP_URL

アプリケーションの公開URLを設定します。SEO・OGP（Open Graph Protocol）に使用されます。

#### 設定値

```bash
# ローカル開発
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 本番環境
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### 📚 学習ポイント: なぜ必要？

```
【SEO（検索エンジン最適化）】
- canonical URL: 重複コンテンツを防ぐ正規URL
- sitemap.xml: 検索エンジンにページ構造を伝える

【OGP（ソーシャルメディア共有）】
- Twitter/Facebookでリンク共有時のプレビュー表示
- og:url として使用される
- 絶対URLが必要（相対URLは不可）

【Next.js Metadata】
- metadataBase として設定
- 各ページのmetadata.openGraph.urlが相対パスの場合、
  このベースURLと結合される
```

#### 使用例

`web/src/app/layout.tsx` で以下のように使用されています：

```typescript
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://kabu-news-ai.example.com",
  ),
  // ...
};
```

---

### 2. Supabase

#### プロジェクト作成

1. [Supabase](https://supabase.com/) にアクセス
2. 「Start your project」→ Googleアカウントでログイン
3. 「New project」をクリック
4. 設定:
   - Organization: 新規作成 or 既存
   - Project name: `ai-investment-partner`
   - Database Password: 強力なパスワードを設定（メモしておく）
   - Region: `Northeast Asia (Tokyo)`
5. 「Create new project」

#### キーの取得

1. プロジェクト Dashboard → 左メニュー「Settings」
2. 「API」タブを選択
3. 以下をコピー:

```
NEXT_PUBLIC_SUPABASE_URL = Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY = anon public
SUPABASE_SERVICE_ROLE_KEY = service_role (secret)
```

#### 📚 学習ポイント: anon vs service_role

```
【anon キー】
- Row Level Security (RLS) が適用される
- ユーザーは自分のデータのみアクセス可能
- クライアントサイドで使用

【service_role キー】
- RLS をバイパス
- 全データにアクセス可能
- サーバーサイドのみで使用（絶対に公開しない）
```

---

### 3. Vertex AI

本プロジェクトでは Google AI Studio（APIキー認証）ではなく **Vertex AI**（GCP Service Account / ADC 認証）を使用します。

#### ローカル開発: Application Default Credentials (ADC)

APIキー不要。gcloud CLI でログインするだけで動作します。

```bash
# GCPアカウントでADC認証
gcloud auth application-default login

# プロジェクトを設定
gcloud config set project YOUR_PROJECT_ID
```

認証後、アプリケーションは自動的に ADC を使用して Vertex AI を呼び出します。

#### 環境変数の設定

```bash
GCP_PROJECT_ID=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=asia-northeast1
```

#### 📚 学習ポイント: Vertex AI のレート制限

| 項目       | Vertex AI（Gemini 2.5 Flash）                                          |
| ---------- | ---------------------------------------------------------------------- |
| クォータ   | 動的共有クォータ。プロジェクトごとの固定の RPM 上限はない              |
| 混雑時     | 共有の処理能力が足りないと 429（Resource exhausted）が返る             |
| 引き上げ   | Quotas 画面に引き上げを申請できる項目はない                            |
| 課金モデル | 従量課金（トークン単位）。無料枠はない                                 |

AI Studio（Gemini Developer API）の無料枠は「1分あたり・1日あたりの回数」で決まっています。一方、Vertex AI の Gemini 2.x 系は、全利用者で共有する処理能力をそのときの混み具合に応じて割り当てる方式です。429 が返ったら指数バックオフで再試行し、それでも足りなければ global エンドポイントや Provisioned Throughput（事前に購入する処理枠）を検討します。本プロジェクトでは、バッチ処理とキャッシュで呼び出し回数そのものを減らしています。

#### 使用モデル

- `gemini-2.5-flash`（高速・低コスト）

> ⚠️ Gemini 2.5 Flash は、Vertex AI では 2026-10-20 に提供を終える予定で、新しいプロジェクトからは既に呼び出せません。これから試す場合は、[モデルのバージョンとライフサイクル](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions) で後継のモデルを確認し、下の URL のモデル名を置き換えてください。

#### 動作確認

```bash
# ADC認証確認
gcloud auth application-default print-access-token

# Vertex AI エンドポイントへのテスト呼び出し
curl -X POST \
  "https://asia-northeast1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_ID/locations/asia-northeast1/publishers/google/models/gemini-2.5-flash:generateContent" \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello!"}]}]}'
```

---

### 4. Firebase Authentication（オプション）

> 本プロジェクトでは使っていません（認証は Supabase Auth）。初期構想の名残として残しています。

Supabase Auth を使用する場合は不要です。Firebase Auth を使用する場合の設定：

#### Firebase プロジェクト作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」
3. プロジェクト名: `ai-investment-partner`
4. Google アナリティクス: オフでOK
5. 「プロジェクトを作成」

#### Webアプリの登録

1. プロジェクト概要 → 「ウェブ」アイコン（</>）をクリック
2. アプリのニックネーム: `web`
3. 「このアプリの Firebase Hosting も設定します」: チェック不要
4. 「アプリを登録」
5. 表示される設定をコピー

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "ai-investment-partner.firebaseapp.com",
  projectId: "ai-investment-partner",
  storageBucket: "ai-investment-partner.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

#### Google認証の有効化

1. 左メニュー「Authentication」
2. 「始める」
3. 「Sign-in method」タブ → 「Google」
4. 「有効にする」トグルをオン
5. プロジェクトのサポートメール: 自分のメールアドレス
6. 「保存」

---

### 5. Slack Webhook

AI 生成の実行状況・用語集の生成・X 投稿の下書きなどを Slack チャンネルに通知するために使用します（ニュース解説記事の日次生成は停止済み）。

#### Incoming Webhook の作成

1. [Slack API](https://api.slack.com/apps) にアクセス → 「Create New App」
2. 「From scratch」→ アプリ名を入力 → ワークスペースを選択
3. 左メニュー「Incoming Webhooks」→ 「Activate Incoming Webhooks」をオン
4. 「Add New Webhook to Workspace」→ 通知先チャンネルを選択
5. 表示された Webhook URL をコピー

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```

#### 通知内容

```
📰 ニュース記事が生成されました
テーマ: 金利と為替の攻防
タイトル: 今日の市場を動かした3つのニュース
https://money-nav.com/news-articles/2026-02-26

✉️ Xポスト用:
【投資初心者向け】今日のマーケットニュース解説 ...
```

---

### 6. CRON_SECRET（開発用テストエンドポイント認証）

`/api/test/*` エンドポイントの認証に使用します。本番の `/api/cron/*` は Cloud Scheduler OIDC で保護されており不要です。

#### 生成方法

```bash
# ランダムなシークレットを生成
openssl rand -base64 32
```

生成した値を `.env` に設定：

```bash
CRON_SECRET=your-random-secret-here
```

---

### 7. GCP_PROJECT_ID（OIDCトークン検証用）

Cloud SchedulerからのリクエストをOIDCトークンで検証するために使用します。

#### 取得方法

```bash
gcloud config get-value project
```

ローカル開発環境では実際のGCPプロジェクトIDを設定してください。
本番環境ではTerraformが `var.project_id` から自動設定します。

```
GCP_PROJECT_ID = ai-product-446711
```

---

## 本番環境での設定

### Secret 管理の流れ

Terraform は Secret Manager のシークレット（入れ物）と IAM だけを作り、**値は `gcloud secrets versions add` で直接登録**します。値が Terraform や CI を通らないので、tfstate にもリポジトリにも値が残りません。

経緯（詳しくは [CI/CD](../deployment/CICD.md) の「Secret 注入フロー」）：

- 初期：`terraform.tfvars` に値を書き、Terraform で Secret のバージョンまで作っていた（tfstate に平文で残る）
- 〜2026-02-15：GitHub Secrets に登録し、GitHub Actions がデプロイのたびに Secret Manager に注入していた
- 2026-02-15（`bcc0617`）以降：注入ステップを削除し、手動で登録
- 2026-08-18：サービス終了に伴い、Secret Manager のシークレットと GitHub Secrets を削除

### 1. Terraform でリソース作成

Secret Manager のシークレット（入れ物）を作ります。値はまだ入れません。Cloud Run は値のない Secret を読めずに作成が失敗するので、初回は Secret だけを先に作ります（手順全体は [GCP設定](./GCP.md) の「適用」）。

```bash
cd terraform
terraform init -backend-config="bucket=ai-product-446711-terraform-state"
terraform apply \
  -target=google_secret_manager_secret.supabase_url \
  -target=google_secret_manager_secret.supabase_anon_key \
  -target=google_secret_manager_secret.supabase_service_role_key \
  -target=google_secret_manager_secret.slack_webhook_url
```

### 2. 値を登録

```bash
# Supabase
printf '%s' "https://xxx.supabase.co" | gcloud secrets versions add supabase-url --data-file=-
printf '%s' "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | gcloud secrets versions add supabase-anon-key --data-file=-
printf '%s' "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | gcloud secrets versions add supabase-service-role-key --data-file=-

# Slack
printf '%s' "https://hooks.slack.com/services/..." | gcloud secrets versions add slack-webhook-url --data-file=-
```

⚠️ **注意**: `echo` は末尾に改行を付けるため、そのまま登録すると値の最後に改行が入ります。`printf '%s'`（または `echo -n`）を使ってください。Secret Manager の公式クイックスタートも `echo -n` を使っています。

### 3. GitHub Secrets（Docker ビルド用）

GitHub Secrets は、`deploy.yml` が Docker イメージをビルドするときに渡す値にだけ使っていました（Secret Manager への注入には使っていません）。

| Secret名                        | 用途                                                             |
| ------------------------------- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | ビルド時に JavaScript へ埋め込む                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ビルド時に JavaScript へ埋め込む                                 |
| `SUPABASE_SERVICE_ROLE_KEY`     | ビルド中だけ使う（BuildKit の secret として渡し、イメージには残さない） |
| `GCP_PROJECT_NUMBER`            | Workload Identity のプロバイダ名を組み立てる                     |

`NEXT_PUBLIC_*` はビルド時に埋め込まれるため、Cloud Run の環境変数を変えてもブラウザ側の値は変わりません。（`deploy.yml` は `NEXT_PUBLIC_APP_URL` も参照しています。）

### 📚 学習ポイント: 環境変数 vs Secret Manager

```
【環境変数（Cloud Run 設定）】
- Cloud Console や Terraform で設定
- サービスの設定の一部なので、サービスを閲覧できる人なら誰でも値を読める
- 非機密情報に使用（リージョン、ポート等）

【Secret Manager】
- 値を読むには Secret ごとの権限（secretAccessor）が必要
- 読み取りを監査ログに残せる（データアクセス監査ログを有効にした場合）
- バージョン管理可能
- 機密情報に使用（APIキー、パスワード等）

※ 保存時の暗号化はどちらも行われる。違いは「誰が値を読めるか」を絞れるかどうか
```

### Cloud Run での参照

Terraform で Secret Manager の値を Cloud Run に渡す設定：

```hcl
# terraform/cloud-run.tf
resource "google_cloud_run_v2_service" "app" {
  # ...

  template {
    containers {
      env {
        name  = "NEXT_PUBLIC_SUPABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.supabase_url.secret_id
            version = "latest"
          }
        }
      }
      # 他のシークレットも同様に設定
    }
  }
}
```

環境変数として渡す Secret は、**インスタンスの起動時に1回だけ**読み込まれます。`version = "latest"` だと、Secret を更新しても動作中のインスタンスには反映されず、どのバージョンが使われているかも分かりにくくなります。Google はこの理由から、環境変数で使う Secret はバージョンを固定することを推奨しています（常に最新を読みたい場合はボリュームとしてマウントする）。

---

## .env の完成例

```bash
# ========================================
# アプリケーション設定
# ========================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ========================================
# Supabase
# ========================================
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.xxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ.yyyy

# ========================================
# Vertex AI（ローカルはADCを使用。APIキー不要）
# GCP_PROJECT_ID は Cloud Scheduler の OIDC 検証にも使う
# ========================================
GCP_PROJECT_ID=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=asia-northeast1

# ========================================
# Slack
# ========================================
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXX

# ========================================
# 開発用テストエンドポイント
# ========================================
CRON_SECRET=your-random-secret-here
```

---

## セキュリティチェックリスト

- [ ] `.env` が `.gitignore` に含まれている
- [ ] `SUPABASE_SERVICE_ROLE_KEY` は `NEXT_PUBLIC_` がついていない
- [ ] 本番環境では Secret Manager を使用
- [ ] 本番の `/api/cron/` は OIDC 認証のため `CRON_SECRET` 不要（`/api/test/` のローカルテストには任意で使用可）

---

## 関連ドキュメント

- [ローカル開発環境](./LOCAL.md) - 開発サーバーの起動方法
- [GCP設定](./GCP.md) - Secret Manager の詳細
- [CI/CD](../deployment/CICD.md) - 本番デプロイ時のシークレット設定
