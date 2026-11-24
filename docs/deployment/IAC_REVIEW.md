# IaC設計レビュー - Terraform & GitHub Actions

## Context

kabu-news-ai プロジェクトの Infrastructure as Code (IaC) 設計をレビューし、業界標準のベストプラクティスと照らし合わせて評価します。現在の実装は以下で構成されています：

- **Terraform**: GCPリソース定義（10ファイル）
- **GitHub Actions**: CI/CDパイプライン（2ワークフロー）
- **対象リソース**: Cloud Run, Cloud Scheduler, Secret Manager, Artifact Registry, Workload Identity Federation

> 📝 **その後の検証（2026-09-24）**: 本書は 2026-02 時点の評価の記録として残している。停止後に GCP の実環境とコードで確かめたところ、次の点が本文と違っていた。
>
> - **Terraform Plan の CI（#8）は 2026-07-02 以降すべて失敗していた。** キャンセルされた plan がロックを残し、以降の PR（#29・#67・#84 など）はロックを取得できずに終了している。`terraform plan ... | tee plan.txt` の終了コードが最後の `tee` の 0 になるため、結果は success と表示されていた。さらにこのワークフローは `prefix=kabu-news-ai` で初期化しており、実際の state（2026-02-19 以降はバケット直下）を見ていなかった
> - **「state への平文漏洩を解消」（#5）は、今の state に限った話だった。** prefix `kabu-news-ai` 側に残った 2026-02-11 時点の古い state には、シークレット6件が平文で入っていた（2026-09-24 に削除）
> - `sensitive = true` の変数はなく、validation があるのは3変数（`project_id`・`region`・`app_image_tag`）だけ
> - Secret の `version = "latest"` はベストプラクティスではない。環境変数の Secret は起動時に1回だけ読まれるため、Google はバージョンの固定を推奨している
> - `/api/cron/*` の保護は `Authorization` ヘッダーの共有シークレットではなく、Scheduler の OIDC トークンをアプリ（`verifySchedulerToken`）で検証する方式（#6）。`allUsers` に `run.invoker` を付けて公開しているため、`api-scheduler` の `run.invoker` は門番として効いていない
> - Cloud Armor は Cloud Run に直接付けられない。外部アプリケーションロードバランサ（サーバーレス NEG）を前に置く必要があり、その分の常時費用がかかる（#6）
> - 「比較」の表（State管理・CI/CD の行）と「ドキュメント」の節（`terraform/README.md` がない）は、本文の「解決済み」より前の状態のまま

---

## 総合評価

### 🟢 現在のスコア: **9.0/10** （前回: 8.5/10）

**2026年2月更新**: Terraform stateへのシークレット平文漏洩を解消（Cloud SchedulerのOIDC移行）。※古い prefix の state には平文が残っていた（冒頭の「その後の検証」参照）

本プロジェクトのIaC設計は、**エンタープライズグレード手前の高品質**であり、多くのベストプラクティスを適用しています。特にセキュリティ面（Workload Identity、最小権限、Git漏洩防止）とコスト最適化は優れています。

さらに引き上げるには、以下の改善が推奨されます：

1. 環境分離（dev/staging/prod）
2. Terraformモジュール化
3. より高度なデプロイ戦略（Blue/Green、Canary）

---

## ✅ 優れている点（Best Practices達成）

### 1. ファイル構成とモジュール化

- ✅ 責務ごとにファイル分割（cloud-run.tf, secrets.tf, iam.tf など）
- ✅ DRY原則適用（locals.tf で共通値を集約）
- ✅ 明確な命名規則（`google_service_account.cloud_run`）

```
terraform/
├── main.tf              # プロバイダー設定
├── variables.tf         # 入力変数
├── locals.tf            # ローカル変数
├── backend.tf           # State管理
├── outputs.tf           # 出力
├── cloud-run.tf         # Cloud Run
├── cloud-scheduler.tf   # Scheduler
├── secrets.tf           # Secret Manager
├── iam.tf               # IAM
└── workload-identity.tf # WIF
```

### 2. セキュリティベストプラクティス

#### Workload Identity Federation (WIF)

```hcl
# キーレス認証 - サービスアカウントキーを使用しない
resource "google_iam_workload_identity_pool" "github_actions" {
  workload_identity_pool_id = "github-actions-pool"
}
```

- ✅ GitHub Actions → GCP 認証でキーを使用しない
- ✅ OIDC トークンベースの認証
- ✅ リポジトリ制限（`assertion.repository == 'owner/repo'`）

#### 最小権限の原則

```hcl
# 個別のSecret IAMバインディング（全Secretへのアクセス権ではない）
resource "google_secret_manager_secret_iam_member" "cloud_run_supabase_url" {
  secret_id = google_secret_manager_secret.supabase_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}
```

- ✅ Cloud Run SA は必要な Secret のみアクセス可能
- ✅ GitHub Actions SA も必要最小限の権限のみ
- ✅ Service Account の責務分離（cloud_run, scheduler, github_actions）

#### シークレット管理

- ✅ Secret Manager 使用（環境変数のハードコード回避）
- ✅ `sensitive = true` for variables
- ✅ Secret の `version = "latest"` 参照

### 3. コスト最適化

```hcl
scaling {
  min_instance_count = 0  # 無料枠内
  max_instance_count = 2
}

resources {
  limits = {
    cpu    = "1"
    memory = "512Mi"
  }
  cpu_idle = true          # CPUを常時割り当てない
  startup_cpu_boost = true # 起動時のみブースト
}
```

- ✅ Cloud Run 最小インスタンス 0（コールドスタート許容）
- ✅ cpu_idle でアイドル時のコスト削減
- ✅ 適切なリソースリミット

### 4. 変数バリデーション

```hcl
variable "app_image_tag" {
  validation {
    condition     = length(var.app_image_tag) > 0 && var.app_image_tag != "latest"
    error_message = "app_image_tag must be specified and cannot be 'latest'."
  }
}
```

- ✅ すべての変数に validation ブロック
- ✅ "latest" タグを禁止（デプロイの追跡可能性）
- ✅ GCP形式のバリデーション（project_id, region）

### 5. ヘルスチェックと信頼性

```hcl
startup_probe {
  http_get { path = "/api/health" }
  initial_delay_seconds = 5
  failure_threshold     = 3
}

liveness_probe {
  http_get { path = "/api/health" }
  period_seconds    = 30
  failure_threshold = 3
}
```

- ✅ startup_probe で起動確認
- ✅ liveness_probe で継続的なヘルスチェック
- ✅ デプロイ後の検証（`curl -sf $URL/api/health`）

### 6. CI/CDベストプラクティス

#### GitHub Actions - deploy.yml

- ✅ concurrency で並列実行制御（古いワークフローをキャンセル）
- ✅ Docker Buildx のキャッシュ（`cache-from: type=gha`）
- ✅ PR時はビルドのみ、main push時のみデプロイ
- ✅ コミットSHAベースのイメージタグ（トレーサビリティ）

#### GitHub Actions - test.yml

- ✅ setup ジョブで依存関係インストール → キャッシュ
- ✅ type-check, lint, test を並列実行
- ✅ timeout設定で無限ループ防止
- ✅ カバレッジアップロード

### 7. 依存関係管理

- ✅ 明示的な `depends_on`（APIの有効化 → リソース作成）
- ✅ API有効化後のリソース作成順序が適切

---

## ⚠️ 改善が必要な点

### ✅ 解決済み（Critical改善）

#### 1. Backend設定のハードコード → **解決済み**

**実装内容**:

- `terraform/backend.tf` - ハードコードを削除し、`terraform init -backend-config` で動的指定する方式に変更

```bash
# Backend を動的指定して初期化
terraform init \
  -backend-config="bucket=ai-product-446711-terraform-state" \
  -backend-config="prefix=kabu-news-ai"
```

**効果**:

- プロジェクトIDを引数で指定可能
- 複数GCPプロジェクトでコードを再利用可能
- 初期化が1コマンドで完了

#### 2. State Lockingの明示化 → **解決済み**

**実装内容**:

- `docs/development/TERRAFORM.md` - State Lockingの詳細説明を追加
- `terraform/README.md` - State Lockingセクションを含む

**効果**:

- GCS自動Lockingの仕組みを明示化
- CI/CDでのタイムアウト設定（`-lock-timeout=5m`）
- チーム開発時の競合防止策をドキュメント化

#### 3. シークレット管理の改善 → **解決済み**

**実装内容**:

- `terraform/secrets.tf` - Secret Versionリソースを削除（リソース定義のみ）
- `terraform/variables.tf` - Secret関連変数を削除
- `.github/workflows/deploy.yml` - Secret注入ステップを追加
- `docs/setup/SECRETS.md` - 新しいSecret管理フローを追加

```yaml
# GitHub Actions で自動注入
- name: Update Secret Manager values
  run: |
    echo "${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}" | gcloud secrets versions add supabase-url --data-file=-
    # ...
```

**効果**:

- terraform.tfvarsにシークレット値を保存しない（Git漏洩リスクゼロ）
- GitHub Secretsを信頼できる唯一の情報源とする
- CI/CDで自動的にSecret Managerに反映

> 📝 **その後の変更（2026-02-15, `bcc0617`）**: Secret 注入ステップは `deploy.yml` から削除した。以降の値は `gcloud secrets versions add` で手動登録している（`terraform/secrets.tf` のコメント参照）。上記は当時の記録として残している。

#### 5. Terraform stateへのシークレット漏洩の解消 ✅

**問題の詳細**:
`data "google_secret_manager_secret_version"` データソースを使用すると、
Terraformは読み取った値（`secret_data`）をtfstateファイルに**平文**で書き込む。
GCSバックエンドにstateを保存していた場合、Secret Managerで守っているシークレットが
tfstateを通じて漏洩するリスクがあった。

**解決策**: Cloud SchedulerをOIDCトークン認証に移行

- Bearerトークン（文字列シークレット）→ GCPサービスアカウントのOIDCトークン
- `data source` 自体を廃止することでstateへの漏洩を根本から解消
- `api-scheduler` SAはすでに `roles/run.invoker` を保持していたため、インフラ変更は最小限

**変更ファイル**:

- `terraform/cloud-scheduler.tf`: `Authorization` ヘッダー → `oidc_token` ブロック
- `terraform/secrets.tf`: `data source` と IAMバインディング削除
- `terraform/cloud-run.tf`: `CRON_SECRET` env var削除 → `GCP_PROJECT_ID` 追加
- `web/src/shared/lib/verify-scheduler-token.ts`: 新規作成（`google-auth-library` でJWT検証）

---

### 🟡 Important（優先度：中）

#### 4. 環境分離（dev/staging/prod）

**問題点**:

- 現在は単一環境（production想定）
- 環境ごとの設定変更が難しい

**推奨される改善**:
Terraform Workspaces または ディレクトリ分割

**方法A: Workspaces**

```bash
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod
```

```hcl
# variables.tf
locals {
  env = terraform.workspace
  project_name = "${local.project_name}-${local.env}"
}
```

**方法B: ディレクトリ分割**

```
terraform/
├── modules/
│   ├── cloud-run/
│   ├── secrets/
│   └── iam/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   └── prod/
```

#### 5. Terraformモジュール化

**問題点**:

- 現在は単一プロジェクトの構成
- 再利用可能なモジュールがない
- 将来的に複数プロジェクトで同じパターンを使う際に重複

**推奨される改善**:

```
terraform/
├── modules/
│   ├── cloud-run-app/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── workload-identity/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── main.tf (モジュールを呼び出す)
```

```hcl
# main.tf
module "cloud_run_app" {
  source = "./modules/cloud-run-app"

  project_id   = var.project_id
  region       = var.region
  service_name = "kabu-news-ai"
  image        = local.cloud_run_image
}
```

#### 6. Cloud Runのアクセス制御

**問題点**:

```hcl
# cloud-run.tf
resource "google_cloud_run_v2_service_iam_member" "public" {
  role   = "roles/run.invoker"
  member = "allUsers"  # 誰でもアクセス可能
}
```

- 現在は完全に公開（`allUsers`）
- セキュリティ要件によっては問題

**推奨される対応**:

- Web UIは公開で問題なし
- ただし、`/api/cron/*` エンドポイントは `Authorization` ヘッダーで保護済み（✅）
- 将来的にはCloud Armorでのレート制限を検討

#### 7. NODE_ENV のハードコード

**問題点**:

```hcl
env {
  name  = "NODE_ENV"
  value = "production"  # ハードコード
}
```

- 環境ごとに変えたい場合に対応できない

**推奨される改善**:

```hcl
variable "node_env" {
  default = "production"
}

env {
  name  = "NODE_ENV"
  value = var.node_env
}
```

---

### ✅ Nice to Have（実装済み）

#### 8. Terraform Plan の CI チェック → **解決済み**

> ⚠️ 2026-07-02 以降は機能していなかった（冒頭の「その後の検証」参照）。

**実装内容**:

- `.github/workflows/terraform-plan.yml` - PR時の自動Plan実行

```yaml
# .github/workflows/terraform-plan.yml
on:
  pull_request:
    paths:
      - "terraform/**"

jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - name: Terraform Plan
        run: terraform plan -lock-timeout=5m -no-color -out=tfplan

      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            // terraform plan の結果をPRコメントに投稿
```

**効果**:

- PR時に変更内容を自動確認
- レビュワーがインフラ変更を把握しやすい
- terraform fmt/validate チェックも実行

#### 9. タグ管理の改善

**問題点**:

- 現在はコミットSHAのみ（例: `abc1234`）
- セマンティックバージョニングがない

**推奨される改善**:

```yaml
# deploy.yml
- name: Generate image tag
  run: |
    if [[ "${{ github.ref }}" == refs/tags/* ]]; then
      echo "IMAGE_TAG=${GITHUB_REF#refs/tags/}" >> $GITHUB_OUTPUT
    else
      echo "IMAGE_TAG=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT
    fi
```

#### 10. ロールバック戦略

**推奨される追加**:

```yaml
# .github/workflows/rollback.yml
on:
  workflow_dispatch:
    inputs:
      image_tag:
        description: "Image tag to rollback to"
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy previous version
        run: |
          gcloud run deploy $SERVICE_NAME \
            --image=$IMAGE_URL:${{ inputs.image_tag }} \
            --region=$REGION
```

---

## 比較: 業界標準ベストプラクティス

| カテゴリ           | 現在の実装                    | 業界標準                 | ギャップ            |
| ------------------ | ----------------------------- | ------------------------ | ------------------- |
| **ファイル構成**   | モジュール化済み              | モジュール + 環境分離    | 環境分離なし        |
| **セキュリティ**   | WIF, 最小権限, Secret Manager | 同様                     | **✅ 達成**         |
| **State管理**      | GCS バックエンド              | GCS + Locking            | Lockingの明示化不足 |
| **変数管理**       | Validation付き                | 同様                     | **✅ 達成**         |
| **CI/CD**          | 自動デプロイ                  | 同様 + Terraform Plan PR | Plan PR なし        |
| **環境分離**       | 単一環境                      | dev/staging/prod         | 未対応              |
| **コスト最適化**   | 最小インスタンス0             | 同様                     | **✅ 達成**         |
| **ヘルスチェック** | startup + liveness            | 同様                     | **✅ 達成**         |
| **デプロイ戦略**   | 単純デプロイ                  | Blue/Green or Canary     | 未対応              |

---

## 実装優先度マトリクス

```
┌─────────────────────────────────────────────────┐
│ 高 │ 1. Backend自動化 │ 2. State Locking │     │
│ 影 │ 3. Secret管理    │                  │     │
│ 響 ├──────────────────┼──────────────────┼─────┤
│ 度 │ 4. 環境分離      │ 7. NODE_ENV変数化│     │
│ 中 │ 5. モジュール化  │                  │     │
│    ├──────────────────┼──────────────────┼─────┤
│ 低 │                  │ 8. Terraform Plan│ 10. │
│    │                  │ 9. タグ管理      │ロール│
│    │                  │                  │バック│
└────┴──────────────────┴──────────────────┴─────┘
     低              中              高
              実装コスト
```

**推奨実装順序**:

1. Backend設定の自動化（コスト低・影響高）
2. State Lockingの明示化（コスト低・影響高）
3. シークレット管理の改善（コスト中・影響高）
4. 環境分離（コスト中・影響中）
5. モジュール化（コスト中・影響中）

---

## 追加の推奨事項

### ドキュメント

- ✅ CLAUDE.md に概要記載済み
- ⚠️ terraform/ ディレクトリに README.md がない
- 推奨: `terraform/README.md` を追加（初期化手順、apply手順、変数一覧）

### Terraform バージョン管理

```hcl
# main.tf
terraform {
  required_version = ">= 1.5.0"  # ✅ 指定済み
}
```

- ✅ Terraform バージョン指定
- ✅ Provider バージョン指定（`~> 5.0`）

### コスト可視化

- 推奨: Infracost 導入（PR時にコスト変化を表示）

```yaml
- name: Infracost
  uses: infracost/actions/comment@v1
```

---

## まとめ

### 🎯 現状の評価

本プロジェクトのIaC設計は、**エンタープライズグレード手前の高品質**です。

**特に優れている点**:

- ✅ セキュリティ（WIF、最小権限、Git漏洩防止）
- ✅ コスト最適化（Cloud Run無料枠内）
- ✅ CI/CD自動化（GitHub Actions + Terraform Plan PR）
- ✅ Backend自動化（運用効率）
- ✅ Secret管理の分離（セキュリティ）

**さらなる改善で価値が得られる点**:

- 環境分離（dev/staging/prod）
- Terraformモジュール化（再利用性）
- デプロイ戦略の高度化（Blue/Green、Canary）

### 📊 ベンチマーク

- **2024年12月**: 7.5/10（中規模プロジェクトの優良ライン）
- **2025年1月**: 8.5/10（エンタープライズグレード手前）← Critical改善完了
- **2026年2月（現在）**: 9.0/10（stateセキュリティ改善）← state漏洩解消完了
- **すべて改善後**: 9.5/10（エンタープライズグレード）

### 🚀 Next Steps

次の改善として、環境分離（dev/staging/prod）とTerraformモジュール化を実装することで、複数プロジェクトでの再利用性とスケーラビリティが向上します。

---

## 検証方法

改善実装後の検証手順:

### ✅ 実装済み項目の検証

1. **Backend自動化**: `terraform init -backend-config="bucket=..." -backend-config="prefix=..."` で初期化が成功 ✅
2. **State Locking**: 2つのターミナルで同時に `terraform apply` した際にLockされる ✅
3. **シークレット管理**: `terraform.tfvars` にシークレット値が含まれていない ✅
4. **Terraform Plan PR**: PRに自動的にPlan結果がコメントされる ✅

### 🔜 未実装項目の検証

5. **環境分離**: dev/staging/prod を独立してデプロイできるか
6. **モジュール化**: 別プロジェクトでモジュールを再利用できるか
