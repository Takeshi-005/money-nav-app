# Terraform インフラ管理

このディレクトリには、GCP（Google Cloud Platform）上のインフラをコードで管理するTerraform設定が含まれています。

> ⚠️ **サービス終了に伴い、2026-08-18 にここで定義している GCP リソースを削除済みです。** state からも除去済み（API 有効化の `google_project_service` 9件を除く）で、`.tf` の定義だけが残っています。`terraform apply` すると作り直しが始まりますが、新しく作られる Artifact Registry は空でイメージがないため Cloud Run の作成で失敗し、途中まで作られた状態で止まります。**`apply` は実行しないでください。** 経緯は [docs/shutdown/SHUTDOWN_CHECKLIST.md](../docs/shutdown/SHUTDOWN_CHECKLIST.md) を参照してください。

---

## プロジェクト概要

| 項目         | 内容                                       |
| ------------ | ------------------------------------------ |
| プロバイダー | Google Cloud Platform                      |
| リージョン   | asia-northeast1（東京）                    |
| State保存    | GCS（Google Cloud Storage）                |
| 主要リソース | Cloud Run, Cloud Scheduler, Secret Manager |

---

## ディレクトリ構成

```
terraform/
├── README.md                   # このファイル
├── main.tf                     # プロバイダー設定
├── backend.tf                  # State保存先設定
├── variables.tf                # 変数定義
├── locals.tf                   # ローカル変数
├── outputs.tf                  # 出力定義
├── terraform.tfvars.example    # 変数値のテンプレート
│
├── cloud-run.tf                # Cloud Run サービス
├── cloud-scheduler.tf          # Cloud Scheduler（バッチ処理）
├── iam.tf                      # IAM ポリシー
├── secrets.tf                  # Secret Manager
├── workload-identity.tf        # GitHub Actions認証
│
├── .terraform/                 # プロバイダーキャッシュ（Git管理外）
└── .terraform.lock.hcl         # プロバイダーバージョンロック
```

---

## 作成されるリソース

| リソース           | 説明                      | 月額コスト               |
| ------------------ | ------------------------- | ------------------------ |
| Cloud Run          | Next.js アプリケーション  | ¥0（無料枠内）           |
| Artifact Registry  | Docker イメージ保存       | ¥0（0.5GB無料）          |
| Cloud Scheduler    | バッチトリガー（3ジョブ） | ¥0（3ジョブまで無料）    |
| Secret Manager     | シークレット管理（4件）   | ¥0（有効なバージョン6個まで無料） |
| サービスアカウント | Cloud Run・Scheduler・GitHub Actions 用の3つ | ¥0            |

Cloud Scheduler と Secret Manager の無料枠は、プロジェクトではなく**請求先アカウント単位**です。同じ請求先アカウントに別のジョブやシークレットがあれば、その分も数えます。また、Cloud Scheduler は**一時停止中（`paused = true`）のジョブも課金対象として数えます**。¥0 なのは停止しているからではなく、3ジョブが無料枠に収まっているからです。
| Workload Identity  | GitHub Actions 認証       | ¥0                       |

---

## 初期化（初回のみ）

### 1. Backend設定

Terraform State を保存する GCS バケットを作成します。

```bash
# 変数設定
PROJECT_ID="ai-product-446711"  # あなたのプロジェクトID
REGION="asia-northeast1"

# State保存用バケット作成
gcloud storage buckets create gs://${PROJECT_ID}-terraform-state \
    --location=${REGION} \
    --uniform-bucket-level-access
```

### 2. Terraform初期化

Backend設定を動的に指定して初期化します。

```bash
cd terraform

terraform init \
  -backend-config="bucket=${PROJECT_ID}-terraform-state"
```

> 📝 **state の実際の場所**: 2026-02-19 以降、state はバケット直下の `gs://ai-product-446711-terraform-state/default.tfstate`（prefix なし）にあります。ローカルで prefix を付けずに `terraform init` したためです。GCS バックエンドの `prefix` は省略でき、省略してもエラーにならずバケット直下が使われます。以下のコマンドは実際の場所に合わせて prefix を付けていません。`prefix=kabu-news-ai` 側に残っていた 2026-02-11 時点の古い state（平文のシークレットを含む）と残留ロックは、2026-09-24 に削除しました。

### 3. 変数ファイル作成

```bash
# テンプレートをコピー
cp terraform.tfvars.example terraform.tfvars

# 変数値を編集
vim terraform.tfvars
```

**terraform.tfvars の例**:

```hcl
project_id              = "ai-product-446711"
region                  = "asia-northeast1"
app_image_tag           = "v1.0.0"
search_console_site_url = "https://money-nav.com"
ga4_property_id         = "123456789"
developer_email         = "you@example.com"
indexnow_api_key        = "YOUR_INDEXNOW_KEY"
```

---

## 基本コマンド

### フォーマット

```bash
terraform fmt
```

### バリデーション

```bash
terraform validate
```

### プラン（変更確認）

```bash
terraform plan
```

### 適用（変更実行）

```bash
# 対話的確認あり
terraform apply

# 自動承認（CI/CD用）
terraform apply -auto-approve
```

### 状態確認

```bash
# 全リソースの状態表示
terraform show

# 特定リソースの状態表示
terraform state show google_cloud_run_v2_service.app
```

---

## State Locking

GCSバックエンドは自動的にState Lockingをサポートします。

### 仕組み

- `terraform plan` / `apply` の実行中はロックを取る。同時に別の実行が来ると、後から来た方は**待たずにエラーで終了する**（`-lock-timeout` の既定値は `0s`）
- ロックファイルは state と同じ場所に `default.tflock` として作られる（本構成では `gs://ai-product-446711-terraform-state/default.tflock`）
- 正常終了時に自動的にロック解除。プロセスが途中で強制終了されると、ロックが残ることがある

### タイムアウト設定

```bash
# ロックが空くまで最大5分待つ
terraform plan -lock-timeout=5m
terraform apply -lock-timeout=5m
```

### ロック解除（緊急時のみ）

```bash
# エラーメッセージの Lock Info に出る ID を指定する
terraform force-unlock LOCK_ID
```

⚠️ **注意**: 他のプロセスが実行中の場合、State が破損する可能性があります。

### CI/CD とロック

`deploy.yml` の `concurrency` は Docker ビルドと Cloud Run デプロイのためのもので、このワークフローは Terraform を実行しません。Terraform を動かすのは `terraform/` を変えた PR で走る `terraform-plan.yml` で、`-lock-timeout=5m` でロックを待ちます（`concurrency` の設定はありません）。

> ⚠️ **2026-07-02 以降、CI の plan は実際にはすべて失敗していました。** 実行中の plan がキャンセルされてロックが残り、以降の PR（#29・#67・#84 など）ではロックを取得できずに終了しています。それでも結果が success と表示されたのは、`terraform plan ... | tee plan.txt` とパイプしているためです。GitHub Actions の既定のシェルは `pipefail` を有効にしないので、パイプ全体の終了コードは最後の `tee` の 0 になります（`shell: bash` を明示すると `pipefail` が有効になります）。また、このワークフローは `prefix=kabu-news-ai` で初期化しているため、実際の state（バケット直下）ではなく古い state を見ていました。

---

## Secret管理

Terraform は **Secret Manager のシークレット（入れ物）と IAM** だけを作り、**値（バージョン）** は Terraform の外で登録します。値を Terraform で扱うと、tfstate に平文で残るためです。

### 値の登録

```bash
printf '%s' "YOUR_VALUE" | gcloud secrets versions add supabase-url --data-file=-
printf '%s' "YOUR_VALUE" | gcloud secrets versions add supabase-anon-key --data-file=-
printf '%s' "YOUR_VALUE" | gcloud secrets versions add supabase-service-role-key --data-file=-
printf '%s' "YOUR_VALUE" | gcloud secrets versions add slack-webhook-url --data-file=-
```

`echo` は末尾に改行を付けるので、改行ごと登録されてしまいます。`printf '%s'`（または `echo -n`）を使います。

Secret にバージョンが1つもないと、Cloud Run はそれを読めずにデプロイが失敗します。Terraform で入れ物を作ったら、Cloud Run を作る前に値を登録します。

### 経緯

- 初期：`terraform.tfvars` に値を書き、Terraform で Secret のバージョンまで作っていた（tfstate に平文で残る）
- 〜2026-02-15：GitHub Actions が main への push のたびに GitHub Secrets の値を Secret Manager に注入していた
- 2026-02-15（`bcc0617`）以降：注入ステップを削除し、上の `gcloud secrets versions add` で手動登録
- 2026-08-18：サービス終了に伴い Secret Manager のシークレットと GitHub Secrets を削除

詳細: [docs/setup/SECRETS.md](../docs/setup/SECRETS.md)

---

## 変数管理

### 必須変数

| 変数名                    | 説明                                   | 例                        | 検証ルール                                   |
| ------------------------- | -------------------------------------- | ------------------------- | -------------------------------------------- |
| `project_id`              | GCP プロジェクトID                     | `ai-product-446711`       | 6-30文字、小文字、ハイフン可                 |
| `app_image_tag`           | Docker イメージタグ                    | `v1.0.0` または `abc1234` | **"latest"禁止**（Immutable Infrastructure） |
| `search_console_site_url` | Search Console の対象サイト            | `https://money-nav.com`   | -                                            |
| `ga4_property_id`         | GA4 プロパティID（数字）               | `123456789`               | -                                            |
| `developer_email`         | SA の借用を許可する開発者のメール      | `you@example.com`         | -                                            |
| `indexnow_api_key`        | IndexNow の API キー                   | -                         | -                                            |

`default` のない変数はすべて必須です。1つでも欠けると、`terraform plan` が値の入力を求めて止まります。

### オプション変数

| 変数名                    | 説明                   | デフォルト値               | 検証ルール          |
| ------------------------- | ---------------------- | -------------------------- | ------------------- |
| `region`                  | GCP リージョン         | `asia-northeast1`          | 有効なGCPリージョン |
| `container_port`          | コンテナポート         | `8080`                     | -                   |
| `github_repository`       | GitHub リポジトリ      | `Takeshi-005/kabu-news-ai` | -                   |

### variables.tf（変数の定義）

変数の型・説明・バリデーションルールを定義：

```hcl
variable "project_id" {
  description = "GCP Project ID"
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.project_id))
    error_message = "Project ID must be valid GCP format"
  }
}
```

### terraform.tfvars（変数の値）

⚠️ **重要**: このファイルは `.gitignore` に含める

```hcl
project_id              = "ai-product-446711"
region                  = "asia-northeast1"
app_image_tag           = "v1.0.0"
search_console_site_url = "https://money-nav.com"
ga4_property_id         = "123456789"
developer_email         = "you@example.com"
indexnow_api_key        = "YOUR_INDEXNOW_KEY"
```

### terraform.tfvars.example（テンプレート）

Git管理対象のテンプレート。チームメンバーはこれをコピーして使用します。上の必須変数がすべて並んでいます。

---

## デプロイフロー

### ローカルからのデプロイ

```bash
cd terraform

# 1. 初期化（初回のみ。state はバケット直下にあるので prefix は付けない）
terraform init \
  -backend-config="bucket=ai-product-446711-terraform-state"

# 2. 変更確認
terraform plan

# 3. 適用
terraform apply
```

### GitHub Actions との分担

- `deploy.yml`（main への push）：Docker イメージをビルドして Artifact Registry に push し、Cloud Run に新しいリビジョンをデプロイする。**Terraform は実行しない**（`cloud-run.tf` がイメージの差分を `ignore_changes` で無視しているのはこのため）
- `terraform-plan.yml`（`terraform/` を変えた PR）：plan の結果を PR にコメントする（2026-07-02 以降は失敗していた。上の「CI/CD とロック」を参照）
- `terraform apply` は人がローカルで実行する。CI 用の SA は Artifact Registry への書き込みと Cloud Run のデプロイに必要な権限しか持たないので、CI からは apply できない
- 2026-08-18 以降、`deploy.yml` は無効化済み

詳細: [docs/deployment/CICD.md](../docs/deployment/CICD.md)

---

## ベストプラクティス

### 1. Image Tag 管理（重要）

**❌ 悪い例:**

```hcl
app_image_tag = "latest"  # NG: デプロイが予測不可能
```

**✅ 良い例:**

```hcl
# セマンティックバージョン
app_image_tag = "v1.2.3"

# Git コミットSHA（推奨）
app_image_tag = "abc1234"
```

**理由**: Immutable Infrastructureの原則に従い、デプロイごとに一意のタグを使用することで、ロールバックが容易になり、デプロイの再現性が保証されます。

ただし `cloud-run.tf` はイメージを `ignore_changes` に入れているため、`app_image_tag` が効くのはサービスを最初に作るときだけです。作成後に値を変えても plan に差分は出ません。以降のイメージ更新は CI（`deploy.yml`）が担当します。

### 2. 環境変数の設定

`cloud-run.tf` で Cloud Run に次の環境変数を設定しています:

| 環境変数                        | 値                           | 説明                                      |
| ------------------------------- | ---------------------------- | ----------------------------------------- |
| `NODE_ENV`                      | `production`                 | Next.js 最適化モード                      |
| `GCP_PROJECT_ID`                | `var.project_id`             | Vertex AI の呼び出し先・OIDC の検証に使う |
| `SCHEDULER_OIDC_AUDIENCE`       | `local.scheduler_oidc_audience` | Cloud Scheduler の OIDC トークンの宛先の検証に使う |
| `GOOGLE_GENAI_USE_VERTEXAI`     | `true`                       | Gemini を Vertex AI 経由で呼ぶ            |
| `GOOGLE_CLOUD_LOCATION`         | `var.region`                 | Vertex AI のリージョン                    |
| `NEXT_PUBLIC_SUPABASE_URL`      | Secret Manager               | Supabase URL                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Secret Manager               | Supabase 公開キー                         |
| `SUPABASE_SERVICE_ROLE_KEY`     | Secret Manager               | Supabase サービスロールキー               |
| `SLACK_WEBHOOK_URL`             | Secret Manager               | Slack 通知                                |
| `SEARCH_CONSOLE_SITE_URL`       | `var.search_console_site_url` | SEO 計測                                 |
| `GA4_PROPERTY_ID`               | `var.ga4_property_id`        | SEO 計測                                  |
| `INDEXNOW_API_KEY`              | `var.indexnow_api_key`       | 検索エンジンへの更新通知                  |

Gemini の API キーはありません。Cloud Run の SA（`cloud-run-app`）に `roles/aiplatform.user` を付与し、アプリはその SA の認証情報（ADC）で Vertex AI を呼びます。

### 3. Cloud Scheduler 設定

- **Retry 回数**: 2回（一時的なエラーに対応）
- **Backoff**: 最小5秒（`glossary-generator` のみ30秒）
- **タイムゾーン**: `Asia/Tokyo`（指定しないと UTC として解釈される）
- **認証**: OIDC Token（`api-scheduler` サービスアカウント。トークンはアプリの `verifySchedulerToken` が検証する）

### 4. タイムアウト設定

- **Cloud Run timeout**: 300秒。1つのリクエストに応答するまでの上限で、起動時間とは関係ない
- **Startup probe**: 5秒後から10秒間隔、タイムアウト5秒。3回続けて失敗するとコンテナは停止され、そのインスタンスは起動失敗になる
- **Liveness probe**: 起動後30秒間隔、タイムアウト5秒。3回続けて失敗するとコンテナが停止され、新しいインスタンスに置き換わる

### 5. 小さな変更を積み重ねる

```
❌ 一度に10個のリソースを追加
✅ 1〜2個ずつ追加してplan/apply
```

### 6. planを必ず確認

```bash
terraform plan

# 出力例
Plan: 1 to add, 0 to change, 0 to destroy.
#     ↑ 追加     ↑ 変更       ↑ 削除
```

### 7. 削除は特に注意

```
# 削除対象がある場合
Plan: 0 to add, 0 to change, 1 to destroy.

⚠️ 本当に削除して良いか確認！
データベースやストレージの削除は取り返しがつかない
```

### 8. Stateのバックアップ

```bash
# Stateファイルのバックアップ
terraform state pull > terraform.tfstate.backup
```

### 9. ラベル付け

GCP では「ラベル」と「タグ」は別の機能です。ここで使っているのは、コンソールでの絞り込みや請求の内訳に使うラベルです（タグは IAM の条件などに使う組織レベルの仕組み）。

```hcl
locals {
  common_labels = {
    project    = "kabu-news-ai"
    managed_by = "terraform"
  }
}

resource "google_cloud_run_v2_service" "app" {
  # ...
  labels = local.common_labels
}
```

---

## トラブルシューティング

### Stateのずれ

リソースが手動で削除された場合：

```bash
# 実際のリソースとの差分を確認してから state に反映する
terraform apply -refresh-only
```

`terraform refresh` は、確認なしで state を書き換えるため非推奨になっています（Terraform 0.15.4 以降）。

### Stateからリソースを削除（実リソースは削除しない）

```bash
terraform state rm google_cloud_run_v2_service.app
```

### ロックが残っている場合

```bash
# エラーメッセージからLOCK_IDを確認
terraform force-unlock LOCK_ID
```

### Providerプラグインのエラー

```bash
# プロバイダーを再取得
rm -rf .terraform/
terraform init -backend-config="bucket=ai-product-446711-terraform-state"
```

`backend.tf` は bucket を持たない部分設定なので、`-backend-config` を付けないと `init` が bucket の入力を求めます。prefix を付けるかどうかで読む state が変わる点にも注意してください（上の「state の実際の場所」を参照）。

---

## 関連ドキュメント

- [Terraformガイド](../docs/development/TERRAFORM.md) - 詳細な学習ガイド
- [GCP設定](../docs/setup/GCP.md) - 初期設定手順
- [CI/CD](../docs/deployment/CICD.md) - 自動デプロイ
- [システム構成](../docs/architecture/OVERVIEW.md) - 全体像
