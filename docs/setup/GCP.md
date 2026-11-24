# GCP設定

Google Cloud Platform の初期設定手順です。

> ⚠️ **サービス終了に伴い、2026-08-18 に本書で作る GCP リソース（Cloud Run・Scheduler・Secret・SA・Workload Identity など）を削除済みです。** 本書は、同じ構成をゼロから作るときの手順を学ぶ資料として残しています。GCP プロジェクト `ai-product-446711` は別サービスと同居しているため、このプロジェクトに対して手順どおりに実行しないでください。経緯は [docs/shutdown/SHUTDOWN_CHECKLIST.md](../shutdown/SHUTDOWN_CHECKLIST.md) を参照してください。

---

## 💡 この手順から学べること

- **GCPプロジェクト** の作成と設定
- **必要なAPI** の有効化
- **サービスアカウント** の概念と作成
- **Terraform** でのインフラ管理

---

## 前提条件

| 項目 | 要件 |
|------|------|
| Googleアカウント | 請求先アカウントが設定済み |
| gcloud CLI | インストール済み |
| Terraform | v1.5 以上 |

### gcloud CLI インストール

```bash
# Mac（Homebrew）
brew install --cask google-cloud-sdk

# 初期設定
gcloud init
```

### Terraform インストール

```bash
# Mac（Homebrew）
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# 確認
terraform version
```

---

## 1. GCPプロジェクト作成

### 📚 学習ポイント: プロジェクトとは？

```
GCPプロジェクト = リソースのコンテナ
- すべてのリソース（Cloud Run, Secret Manager 等）はプロジェクトに属する
- 費用はプロジェクトごとに集計されるが、支払いと無料枠は「請求先アカウント」単位
- IAM 権限は組織・フォルダ・プロジェクト・個別のリソースのどの階層でも付与できる
  （本構成は Secret や Cloud Run サービスなど、リソース単位で付けている）
```

### Cloud Console で作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 上部のプロジェクトセレクター → 「新しいプロジェクト」
3. 設定:
   - プロジェクト名: `ai-investment-partner`（任意）
   - プロジェクトID: `ai-investment-partner-xxxxx`（自動生成。作成時は変更できるが、作成後は変更できない）
   - 場所: 組織なし または 組織を選択
4. 「作成」をクリック

### または gcloud CLI で作成

```bash
# プロジェクト作成
gcloud projects create ai-investment-partner-$(date +%Y%m%d) \
  --name="AI Investment Partner"

# プロジェクトを選択
gcloud config set project ai-investment-partner-xxxxx
```

---

## 2. 請求先アカウントの紐付け

### 📚 学習ポイント: なぜ必要？

```
無料枠内でも請求先アカウントは必須
- GCPはクレジットカード登録なしでは多くのサービスが使えない
- 無料枠を超えた場合のみ課金される
- 使いすぎに気づくために予算アラートを設定する（課金は止まらない）
```

### Cloud Console で設定

1. 左メニュー「お支払い」
2. 「アカウントをリンク」
3. 請求先アカウントを選択（なければ新規作成）

### 予算アラートの設定（推奨）

1. 左メニュー「お支払い」→「予算とアラート」
2. 「予算を作成」
3. 設定:
   - 予算名: `monthly-budget`
   - 金額: `¥1,000`（または任意）
   - アラート: 50%, 90%, 100% でメール通知

⚠️ 予算アラートは**通知だけ**で、金額に達しても課金は止まりません。止めたい場合は、通知を受けて自分でリソースを停止します。

---

## 3. 必要なAPIの有効化

### 📚 学習ポイント: APIとは？

```
GCPサービス = API
- Cloud Run を使う → Cloud Run API を有効化
- デフォルトでは多くのAPIが無効
- 使うサービスのAPIを明示的に有効化する必要あり
```

### 必要なAPI一覧

| API | 用途 |
|-----|------|
| Cloud Run Admin API | Cloud Run サービス管理 |
| Cloud Scheduler API | 定期実行ジョブ |
| Artifact Registry API | Docker イメージ保存 |
| Secret Manager API | シークレット管理 |
| Vertex AI API | Gemini の呼び出し |
| IAM Service Account Credentials API | サービスアカウント認証 |

### gcloud CLI で一括有効化

```bash
gcloud services enable \
  run.googleapis.com \
  cloudscheduler.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  aiplatform.googleapis.com \
  iamcredentials.googleapis.com
```

Docker イメージのビルドは GitHub Actions で行うので、Cloud Build API は使いません。手順5の Terraform（`main.tf` の `google_project_service`）もこれらの API を有効化するので、Terraform を使う場合はこの手順を省略できます。

### 確認

```bash
gcloud services list --enabled
```

---

## 4. サービスアカウント作成

### 📚 学習ポイント: サービスアカウントとは？

```
【ユーザーアカウント】
- 人間が使う
- メールアドレスでログイン
- 対話的な操作

【サービスアカウント】
- アプリケーションや自動処理（CI/CD, バッチ処理等）が使う
- 本構成ではキーファイルを一切使わない
  - Cloud Run: サービスに割り当てた SA の認証情報を自動で取得
  - GitHub Actions: Workload Identity で短期トークンに交換
  - ローカル開発: 自分のアカウントで SA を借用（impersonation）
- キーファイル（JSON）は漏洩すると悪用されるため、Google も使わない方法を推奨している
```

### 本構成で作るサービスアカウント

サービスアカウント（SA）と Workload Identity は、手順5で Terraform がまとめて作ります。**手作業で作る必要はありません**。同じものを手で作ると、名前が違えば Terraform がもう1組作り、名前が同じなら「既に存在する」エラーで止まります。

| SA | 用途 | ロール（付与先） |
|----|------|------------------|
| `cloud-run-app` | Cloud Run の実行用 | `aiplatform.user`（プロジェクト）、`secretmanager.secretAccessor`（**Secret ごと**） |
| `api-scheduler` | Cloud Scheduler が OIDC トークンを発行する用 | `run.invoker`（Cloud Run サービス） |
| `github-actions-deploy` | GitHub Actions のデプロイ用 | `artifactregistry.writer`（リポジトリ）、`run.developer`（Cloud Run サービス）、`iam.serviceAccountUser`（`cloud-run-app` に対して） |

`secretAccessor` はプロジェクト全体ではなく Secret ごとに付けています。このプロジェクトは別サービス `ai-product` と同居しているので、プロジェクト全体に付けると `ai-product` のシークレットまで読めてしまいます。また `run.invoker` は「サービスを呼び出す側」に付けるロールなので、Cloud Run の実行用 SA には不要です。

### GitHub Actions 用（Workload Identity）を gcloud で作る場合

参考として、`workload-identity.tf` と同じものを gcloud で作るコマンドです。

```bash
# Workload Identity Pool 作成
gcloud iam workload-identity-pools create "github-actions-pool" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# プロバイダー作成
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --display-name="GitHub Actions Provider" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository == 'Takeshi-005/kabu-news-ai'"
```

`--attribute-condition` は必須です。GitHub のトークンは全リポジトリで同じ発行元（issuer）から出るため、条件がないと他人のリポジトリのトークンでも交換できてしまいます。Google もこうしたプロバイダでは条件を必ず付けるよう求めており、条件なしで作ろうとすると `INVALID_ARGUMENT: The attribute condition must reference one of the provider's claims.` というエラーになります。さらに堅くするなら、リポジトリ名ではなく数値 ID（`assertion.repository_id`）で絞ります。名前は削除や改名のあとに他人に取り直される可能性がありますが、ID は再利用されないためです。

### 📚 学習ポイント: Workload Identity vs キーファイル

```
【キーファイル（従来）】
- JSONファイルをダウンロード
- GitHubのSecretsに保存
- 漏洩リスクあり

【Workload Identity（推奨）】
- キーファイル不要
- GitHubとGCPが直接連携
- セキュリティが高い
```

---

## 5. Terraform でインフラ構築

### 📚 学習ポイント: なぜ Terraform？

```
【手動構築】
- Cloud Console でポチポチ
- 再現性がない
- 設定の記録が残らない

【Terraform】
- コードでインフラを定義
- Git で履歴管理
- 同じ環境を何度でも再現可能
```

### 初期化

state を保存する GCS バケットを先に作り、backend の設定を渡して初期化します（詳しくは [terraform/README.md](../../terraform/README.md)）。

```bash
cd terraform
PROJECT_ID=$(gcloud config get-value project)

# state 保存用バケット（初回のみ）
gcloud storage buckets create gs://${PROJECT_ID}-terraform-state \
  --location=asia-northeast1 \
  --uniform-bucket-level-access

# Terraformを初期化（backend.tf は bucket を持たない部分設定なので外から渡す）
terraform init -backend-config="bucket=${PROJECT_ID}-terraform-state"
```

### 📚 実行されること

1. プロバイダー（google）のプラグインをダウンロード
2. `.terraform/` ディレクトリに配置
3. バックエンド（状態管理先）の設定

### 変数ファイルの設定

```bash
# テンプレートをコピー
cp terraform.tfvars.example terraform.tfvars

# 編集
vim terraform.tfvars
```

```hcl
# terraform.tfvars
project_id              = "ai-investment-partner-xxxxx"
region                  = "asia-northeast1"
app_image_tag           = "abc1234"  # 最初に push するイメージのタグ（"latest" は不可）
search_console_site_url = "https://your-domain.com"
ga4_property_id         = "123456789"
developer_email         = "you@example.com"
indexnow_api_key        = "YOUR_INDEXNOW_KEY"

# GitHub リポジトリ（Workload Identity用。既定値は Takeshi-005/kabu-news-ai）
github_repository = "your-username/kabu-news-ai"
```

`default` のない変数はすべて必須です。1つでも欠けると `terraform plan` が入力を求めて止まります。

### プランの確認

```bash
terraform plan
```

### 📚 学習ポイント: plan vs apply

```
【terraform plan】
- 変更内容を確認するだけ
- 実際のリソースは作成されない
- 「この変更で大丈夫？」の確認

【terraform apply】
- 実際にリソースを作成/変更
- 課金が発生する可能性あり
- plan で確認してから実行
```

### 適用

⚠️ **初回は一度に全部を apply できません。** Cloud Run はデプロイ時に、イメージが存在することと Secret が読めることを確認します。作ったばかりの Artifact Registry は空で、Secret にも値（バージョン）がないため、そのまま apply すると Cloud Run の作成で失敗します。次の順に進めます。

```bash
# 1. イメージ置き場と Secret の入れ物を先に作る（依存する API の有効化も一緒に行われる）
terraform apply \
  -target=google_artifact_registry_repository.app \
  -target=google_secret_manager_secret.supabase_url \
  -target=google_secret_manager_secret.supabase_anon_key \
  -target=google_secret_manager_secret.supabase_service_role_key \
  -target=google_secret_manager_secret.slack_webhook_url

# 2. linux/amd64 でビルドしたイメージを app_image_tag のタグで push し、
#    Secret の値を登録する（SECRETS.md を参照）

# 3. 残りをまとめて作る（確認プロンプトで yes を入力）
terraform apply
```

---

## 6. 作成されるリソース

Terraform で作成される主なリソース：

| リソース | 用途 | 月額コスト目安 |
|---------|------|--------------|
| Cloud Run | Next.js アプリ | ¥0（無料枠内） |
| Artifact Registry | Docker イメージ | 0.5GB まで無料。古いイメージは自動では消えないので溜まる（停止時には 6.1GB あった） |
| Cloud Scheduler | バッチスケジュール（3ジョブ） | ¥0（3ジョブまで無料） |
| Secret Manager | シークレット保存（4件） | ¥0（有効なバージョン6個まで無料） |
| Vertex AI（Gemini） | AI 生成 | 無料枠なし。トークン数に応じた従量課金 |

Cloud Scheduler と Secret Manager の無料枠は**請求先アカウント単位**です。同じ請求先アカウントの別プロジェクトの分も合わせて数えます。Cloud Scheduler は一時停止中のジョブも課金対象として数えます。

---

## トラブルシューティング

### API有効化エラー

```
Error: Error enabling service: googleapi: Error 403: ... has not been used in project ... before or it is disabled.
```

**解決策**: 該当のAPIを手動で有効化

```bash
gcloud services enable [API名]
```

### 権限不足エラー

```
Error: googleapi: Error 403: The caller does not have permission
```

**解決策**: 自分のアカウントにオーナー権限があるか確認

```bash
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:user:your-email@example.com"
```

### 請求先アカウント未設定エラー

```
Error: googleapi: Error 403: ... project has no linked billing account
```

**解決策**: Cloud Console で請求先アカウントを紐付け

---

## 次のステップ

- [環境変数](./SECRETS.md) - Secret Manager へのシークレット登録
- [CI/CD](../deployment/CICD.md) - GitHub Actions の設定
