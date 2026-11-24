# Terraform ガイド

インフラ変更の手順とベストプラクティスです。

> ⚠️ **サービス終了に伴い、2026-08-18 に本書で扱う GCP リソースを削除済みです。** state からも除去済みで、`.tf` の定義だけが残っています。`terraform apply` すると作り直しが始まりますが、新しく作られる Artifact Registry は空でイメージがないため Cloud Run の作成で失敗し、途中まで作られた状態で止まります。本書のコマンドは読んで学ぶためのものとして扱い、`apply` は実行しないでください。経緯は [docs/shutdown/SHUTDOWN_CHECKLIST.md](../shutdown/SHUTDOWN_CHECKLIST.md) を参照してください。

> 💡 **初学者の方へ**: 本プロジェクトの構成意図（「なぜこの設計なのか」）を理解したい場合は、先に [Terraform 学習ガイド](./TERRAFORM_LEARNING.md) を読むことをおすすめします。本書は操作手順・コマンドのリファレンスとしてご活用ください。

---

## 💡 このガイドから学べること

- **Infrastructure as Code (IaC)** の基本概念
- **Terraform** の基本コマンドとワークフロー
- **GCPリソース** の定義方法
- **安全な変更** の進め方

---

## Terraform とは

### 📚 学習ポイント: IaC の利点

```
【手動構築】
- Cloud Console でポチポチ
- 再現性がない
- 設定の記録が残らない
- 環境間の差異が生まれやすい

【Terraform】
- コードでインフラを定義
- Git で履歴管理
- 同じ環境を何度でも再現可能
- レビュー可能
```

---

## ディレクトリ構造

```
terraform/
├── main.tf                 # プロバイダー設定
├── variables.tf            # 変数定義
├── locals.tf               # ローカル変数
├── outputs.tf              # 出力定義
├── backend.tf              # State 保存先
├── terraform.tfvars        # 変数値（Git管理外）
├── terraform.tfvars.example # 変数値のテンプレート
│
├── cloud-run.tf            # Cloud Run サービス
├── cloud-scheduler.tf      # Cloud Scheduler
├── iam.tf                  # IAM ポリシー
├── secrets.tf              # Secret Manager
├── workload-identity.tf    # GitHub Actions 認証
│
├── .terraform/             # プロバイダーキャッシュ（Git管理外）
└── .terraform.lock.hcl     # プロバイダーロック
```

---

## 基本コマンド

### ワークフロー

```bash
cd terraform

# 1. 初期化（初回のみ、またはプロバイダー変更時）
#    backend.tf は bucket を持たない部分設定なので、-backend-config で渡す
#    （本構成の state はバケット直下にあるため prefix は付けない）
terraform init -backend-config="bucket=ai-product-446711-terraform-state"

# 2. フォーマット（コード整形）
terraform fmt

# 3. バリデーション（構文チェック）
terraform validate

# 4. プラン（変更内容の確認）
terraform plan

# 5. 適用（実際に変更）
terraform apply

# 6. 状態確認
terraform show
```

### 📚 学習ポイント: plan と apply

```
【terraform plan】
- 「何が変更されるか」を表示
- 実際のリソースは変更されない
- 安全に確認できる

【terraform apply】
- 実際にリソースを作成/変更/削除
- plan の結果を確認してから実行
```

---

## 変数の管理

### variables.tf（変数の定義）

```hcl
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "asia-northeast1"
}

variable "github_repository" {
  description = "GitHub repository (owner/repo)"
  type        = string
  default     = "Takeshi-005/kabu-news-ai"
}
```

### terraform.tfvars（変数の値）

```hcl
# ⚠️ このファイルは .gitignore に含める
project_id              = "ai-product-446711"
region                  = "asia-northeast1"
app_image_tag           = "v1.0.0"
search_console_site_url = "https://money-nav.com"
ga4_property_id         = "123456789"
developer_email         = "you@example.com"
indexnow_api_key        = "YOUR_INDEXNOW_KEY"
```

`default` のない変数はすべて必須です。1つでも欠けると `terraform plan` が入力を求めて止まります（一覧は [terraform/README.md](../../terraform/README.md) の「変数管理」）。

### 📚 学習ポイント: 変数の優先順位

上ほど強く、同じ変数に複数の値があれば上の値が使われます。

```
1. コマンドライン引数 (-var / -var-file。複数あれば後に書いたもの)
2. *.auto.tfvars / *.auto.tfvars.json（ファイル名の辞書順で後のもの）
3. terraform.tfvars.json
4. terraform.tfvars
5. 環境変数 (TF_VAR_xxx)
6. default 値
```

`*.auto.tfvars` は `terraform.tfvars` より強い点に注意してください。`terraform.tfvars` を直したのに値が変わらないときは、`*.auto.tfvars` が上書きしていないかを確認します。

---

## リソース定義の例

### Cloud Run サービス

実際の [cloud-run.tf](../../terraform/cloud-run.tf) を、要点だけに絞った例です。

```hcl
# cloud-run.tf（簡略版）
resource "google_cloud_run_v2_service" "app" {
  name     = "kabu-news-ai"
  location = var.region

  template {
    containers {
      # タグは var.app_image_tag（コミット SHA など）。"latest" は variables.tf の検証で禁止している
      image = local.cloud_run_image

      ports {
        container_port = 8080
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      # Secret Manager から環境変数を注入
      env {
        name = "NEXT_PUBLIC_SUPABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.supabase_url.secret_id
            version = "latest"
          }
        }
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }

    scaling {
      min_instance_count = 0  # コスト削減
      max_instance_count = 2
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }
}
```

### Cloud Scheduler

```hcl
# cloud-scheduler.tf（簡略版）
resource "google_cloud_scheduler_job" "prediction_generator" {
  name        = "prediction-generator"
  description = "毎日9時に予測トレーニングを生成"
  schedule    = "0 9 * * *"  # 毎日9:00 JST
  time_zone   = "Asia/Tokyo" # 省略すると UTC
  paused      = true          # サービス終了で停止

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.app.uri}/api/cron/generate-prediction"

    oidc_token {
      service_account_email = google_service_account.scheduler.email
      audience              = google_cloud_run_v2_service.app.uri
    }
  }
}
```

### 📚 学習ポイント: リソースの参照

```hcl
# 他のリソースを参照する
google_cloud_run_v2_service.app.uri
#          ↑ リソースタイプ
#                         ↑ リソース名
#                              ↑ 属性
```

---

## 安全な変更の進め方

### 1. 小さな変更を積み重ねる

```
❌ Bad: 一度に10個のリソースを追加
✅ Good: 1〜2個ずつ追加してplan/apply
```

### 2. plan を必ず確認

```bash
terraform plan

# 出力例
Plan: 1 to add, 0 to change, 0 to destroy.
#     ↑ 追加     ↑ 変更       ↑ 削除
```

### 3. 削除は特に注意

```
# 削除対象がある場合
Plan: 0 to add, 0 to change, 1 to destroy.

# ⚠️ 本当に削除して良いか確認！
# データベースやストレージの削除は取り返しがつかない
```

### 4. State のバックアップ

```bash
# State ファイルのバックアップ
terraform state pull > terraform.tfstate.backup
```

---

## トラブルシューティング

### State のずれ

```bash
# リソースが手動で削除された場合（差分を確認してから state に反映する）
terraform apply -refresh-only

# State からリソースを削除（実リソースは削除しない）
terraform state rm google_cloud_run_v2_service.app
```

`terraform refresh` は確認なしで state を書き換えるため、Terraform 0.15.4 以降は非推奨です。

### ロック解除

```bash
# 別のプロセスがロック中の場合
terraform force-unlock LOCK_ID
```

### 📚 学習ポイント: State とは

```
Terraform State = 「Terraformが管理しているリソースの一覧」

- terraform.tfstate ファイルに保存（本構成では GCS の gs://ai-product-446711-terraform-state/default.tfstate）
- 実際のインフラと比較して差分を検出
- 複数人で作業する場合はリモート保存（GCS等）
```

---

## State Locking

GCSバックエンドは自動的にState Lockingをサポートします。

### 📚 学習ポイント: State Lockingとは

```
【State Locking】
- 複数人が同時にterraform applyを実行するのを防ぐ仕組み
- GCSバックエンドは自動でロック機能を提供
- ロックファイルは state と同じ場所に `default.tflock` として作られる
- 正常終了時に自動的にロック解除（途中で強制終了されると残ることがある）
```

### 仕組み

1. **terraform apply** を実行すると、GCSバケットにロックファイルが作成される
2. 別のユーザーが同時に **terraform apply** を実行すると、既定ではロックを取れずに**すぐエラーで終了**する
3. `-lock-timeout` を指定した場合だけ、指定した時間までロックが空くのを待つ
4. 最初のプロセスが終了するとロックが解除され、待っていたプロセスが実行を始める

### タイムアウト設定

デフォルトではロック取得に失敗すると即座にエラーになります。タイムアウトを設定することで、ロックが解除されるまで待機できます：

```bash
# 5分間ロックを待つ
terraform plan -lock-timeout=5m
terraform apply -lock-timeout=5m
```

### 競合時の対処

#### 1. ロックが残っている場合

```bash
# エラーメッセージ例
Error: Error acquiring the state lock

Lock Info:
  ID:        1234567890abcdef
  Path:      gs://bucket/prefix/default.tflock
  Operation: OperationTypeApply
  Who:       user@example.com
  Version:   1.5.0
  Created:   2025-01-06 10:00:00 UTC

# ロックIDを確認して強制解除
terraform force-unlock 1234567890abcdef
```

⚠️ **注意**: 他のプロセスが実行中の場合、State が破損する可能性があります。必ず他のユーザーに確認してから実行してください。

#### 2. CI/CDでの排他制御

`deploy.yml` には次の `concurrency` があります。

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

ただし `deploy.yml` は Docker ビルドと Cloud Run デプロイのワークフローで、**Terraform を実行しません**。Terraform を動かすのは PR で走る `terraform-plan.yml` で、こちらは `concurrency` を持たず、`-lock-timeout=5m` でロックを待ちます。

> ⚠️ **実際に起きたこと**: 2026-07-02、PR で実行中の plan がキャンセルされ、ロックファイルが残りました。以降の PR の plan はすべてロックを取得できずに終了しています（PR #29・#67・#84 のコメントで確認）。それでも CI が success と表示したのは、`terraform plan ... | tee plan.txt` の終了コードが最後の `tee` の 0 になったためです（GitHub Actions の既定のシェルは `pipefail` を有効にしない）。Terraform の実行を途中で止めるとロックが残るので、Terraform を実行するワークフローに `cancel-in-progress: true` を付けるのは危険です。

### ベストプラクティス

1. **常にタイムアウトを設定**

   ```bash
   # CI/CD で apply する場合の例（本構成の CI は plan だけ）
   terraform apply -auto-approve -lock-timeout=5m
   ```

2. **ロック状態の確認**

   ```bash
   # GCSバケット内のロックファイルを確認（本構成の state はバケット直下）
   gcloud storage ls gs://${PROJECT_ID}-terraform-state/default.tflock
   ```

3. **チーム内での調整**
   - 大きな変更を行う前にSlackで通知
   - PRでterraform planの結果を共有
   - マージ前に他のPRが実行中でないか確認

---

## State ファイルのセキュリティ

### data source がシークレットを漏洩させる仕組み

Terraform の `data source` は外部からデータを読み取り、その**結果をtfstateに書き込む**。

```hcl
# ⚠️ これはシークレットをstateに平文保存する
data "google_secret_manager_secret_version" "my_secret" {
  secret  = google_secret_manager_secret.my_secret.id
  version = "latest"
}

# secret_data の値が terraform.tfstate に平文で記録される
# 例: "secret_data": "my-actual-secret-value-here"
```

GCSにstateを保存している場合でも、stateファイルにアクセスできる人物は
Secret Managerで管理しているシークレットの値を直接読める状態になる。

### 対処方針

**Secret Manager のシークレットを Terraform で読まない**

| 目的                                | NG パターン                            | OK パターン                              |
| ----------------------------------- | -------------------------------------- | ---------------------------------------- |
| Cloud Runに環境変数として渡す       | `data source` で値を読んでTF変数に展開 | Cloud Run の `secret_key_ref` で直接参照 |
| Cloud Schedulerに認証トークンを渡す | Bearerトークンをヘッダーに設定         | `oidc_token` ブロックでSA認証を使用      |
| 外部サービスへの接続情報            | `data source` で読んでoutputに出力     | `gcloud secrets versions add` などで直接登録し、Terraformを経由させない |

### stateに含まれるべきでない情報の確認

```bash
# stateファイルにシークレットが含まれていないか確認
gcloud storage cat gs://YOUR-BUCKET/YOUR-PREFIX/default.tfstate \
  | python3 -m json.tool \
  | grep -E "(secret_data|password|api_key)"
# 何も出力されなければOK
```

今の state から消えても、それ以前のコピー（別の prefix に残った古い state、ローカルのバックアップ、バケットのバージョン）には値が残ります。本構成でも、prefix `kabu-news-ai` に残っていた古い state に平文のシークレットが6件入っていました（2026-09-24 に削除）。一度 state に平文で入った値は、漏れた前提でローテーションします。

---

## ベストプラクティス

### 1. モジュール化

```hcl
# 大規模になったらモジュールに分割
module "cloud_run" {
  source = "./modules/cloud-run"

  project_id   = var.project_id
  service_name = "kabu-news-ai"
}
```

### 2. 環境分離

```
terraform/
├── environments/
│   ├── dev/
│   │   └── terraform.tfvars
│   └── prod/
│       └── terraform.tfvars
└── modules/
    └── cloud-run/
```

### 3. ラベル付け

GCP では「ラベル」と「タグ」は別の機能です。ここで使っているのは、コンソールでの絞り込みや請求の内訳に使うラベルです。

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

## 関連ドキュメント

- [GCP設定](../setup/GCP.md) - 初期設定手順
- [CI/CD](../deployment/CICD.md) - 自動デプロイ
- [システム構成](../architecture/OVERVIEW.md) - 全体像
