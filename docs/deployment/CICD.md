# CI/CD

GitHub Actions による自動デプロイの仕組みです。

> ⚠️ **サービス終了に伴い、このワークフロー（Deploy to Cloud Run）は無効化済みです**（2026-08-18）。デプロイ先の Cloud Run、Workload Identity のプールと SA、GitHub Secrets（4件）もすべて削除済みのため、有効化しても認証の段階で失敗します。本書は仕組みを学ぶ資料として残しています。

---

## 💡 このガイドから学べること

- **GitHub Actions** の基本構文
- **Workload Identity** による安全な認証
- **Docker ビルド** と **Cloud Run デプロイ**
- **PR時のテストビルド** と **main マージ時の自動デプロイ**

---

## ワークフロー概要

```
┌─────────────────────────────────────────────────────────────┐
│                      GitHub                                  │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐          │
│  │  Feature  │    │    PR     │    │   main    │          │
│  │  Branch   │───>│  Review   │───>│  Branch   │          │
│  └───────────┘    └─────┬─────┘    └─────┬─────┘          │
│                         │                │                  │
│                   [Build Test]     [Build & Deploy]        │
└─────────────────────────┼────────────────┼──────────────────┘
                          │                │
                          ▼                ▼
                    ┌───────────────────────────┐
                    │      GitHub Actions       │
                    │  ┌─────────────────────┐  │
                    │  │  Docker Build       │  │
                    │  │  (web/Dockerfile)   │  │
                    │  └──────────┬──────────┘  │
                    │             │              │
                    │  ┌──────────▼──────────┐  │
                    │  │  Artifact Registry  │  │
                    │  │  (イメージ保存)      │  │
                    │  └──────────┬──────────┘  │
                    │             │              │
                    │  ┌──────────▼──────────┐  │
                    │  │  Cloud Run Deploy   │  │
                    │  │  (main時のみ)       │  │
                    │  └─────────────────────┘  │
                    └───────────────────────────┘
```

---

## ワークフローファイル

### 📚 学習ポイント: ファイル配置

```
.github/
└── workflows/
    └── deploy.yml    # ← ここに配置すると自動実行
```

### 完全なワークフロー

実物の `.github/workflows/deploy.yml`（無効化済み）の全文です。

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run

on:
  workflow_dispatch:
  push:
    branches: [main]
    paths:
      - "web/**"
      - ".github/workflows/deploy.yml"
      - "!**/*.md"
      - "!**/*.test.ts"
      - "!**/*.test.tsx"
  pull_request:
    branches: [main]
    paths:
      - "web/**"
      - "!**/*.md"
      - "!**/*.test.ts"
      - "!**/*.test.tsx"

# 同一ブランチでの並列実行を防止（古いワークフローをキャンセル）
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  PROJECT_ID: ai-product-446711
  REGION: asia-northeast1
  SERVICE_NAME: kabu-news-ai
  IMAGE_URL: asia-northeast1-docker.pkg.dev/ai-product-446711/kabu-news-ai/app

jobs:
  # ===========================================
  # ビルドジョブ（PR・push両方で実行）
  # ===========================================
  build:
    name: Build Docker Image
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write # WIF認証に必須

    outputs:
      image_tag: ${{ steps.tag.outputs.IMAGE_TAG }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Generate image tag
        id: tag
        run: echo "IMAGE_TAG=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT

      - name: Authenticate to Google Cloud
        id: auth
        uses: google-github-actions/auth@v3
        with:
          workload_identity_provider: "projects/${{ secrets.GCP_PROJECT_NUMBER }}/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider"
          service_account: "github-actions-deploy@${{ env.PROJECT_ID }}.iam.gserviceaccount.com"
          token_format: "access_token"

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Artifact Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGION }}-docker.pkg.dev
          username: oauth2accesstoken
          password: ${{ steps.auth.outputs.access_token }}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: ./web
          platforms: linux/amd64
          push: ${{ github.event_name == 'push' }}
          tags: |
            ${{ env.IMAGE_URL }}:${{ steps.tag.outputs.IMAGE_TAG }}
            ${{ env.IMAGE_URL }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            NEXT_PUBLIC_SUPABASE_URL=${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
            NEXT_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
            NEXT_PUBLIC_APP_URL=${{ secrets.NEXT_PUBLIC_APP_URL }}
          secrets: |
            "SUPABASE_SERVICE_ROLE_KEY=${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"

  # ===========================================
  # デプロイジョブ（mainへのpush時のみ）
  # ===========================================
  deploy:
    name: Deploy to Cloud Run
    needs: build
    if: (github.event_name == 'push' || github.event_name == 'workflow_dispatch') && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write # WIF認証に必須

    environment:
      name: production
      url: ${{ steps.deploy.outputs.url }}

    steps:
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v3
        with:
          workload_identity_provider: "projects/${{ secrets.GCP_PROJECT_NUMBER }}/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider"
          service_account: "github-actions-deploy@${{ env.PROJECT_ID }}.iam.gserviceaccount.com"

      - name: Deploy to Cloud Run
        id: deploy
        uses: google-github-actions/deploy-cloudrun@v3
        with:
          service: ${{ env.SERVICE_NAME }}
          region: ${{ env.REGION }}
          image: ${{ env.IMAGE_URL }}:${{ needs.build.outputs.image_tag }}

      - name: Verify deployment
        run: |
          echo "Deployed to: ${{ steps.deploy.outputs.url }}"
          curl -sf "${{ steps.deploy.outputs.url }}/api/health" || exit 1

      - name: Output deployment info
        run: |
          echo "### Deployment Summary" >> $GITHUB_STEP_SUMMARY
          echo "- **URL**: ${{ steps.deploy.outputs.url }}" >> $GITHUB_STEP_SUMMARY
          echo "- **Image**: ${{ env.IMAGE_URL }}:${{ needs.build.outputs.image_tag }}" >> $GITHUB_STEP_SUMMARY
          echo "- **Commit**: ${{ github.sha }}" >> $GITHUB_STEP_SUMMARY
```

---

## 必要な設定

### GitHub Secrets

| シークレット名 | 値 | 取得方法 |
|--------------|-----|---------|
| `GCP_PROJECT_NUMBER` | GCPプロジェクト番号 | Cloud Console → プロジェクト設定 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公開キー | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase サービスロールキー | Supabase Dashboard |

### 📚 学習ポイント: Project ID vs Project Number

```
Project ID: ai-product-446711
- 人間が読みやすい識別子
- 環境変数で使用

Project Number: 123456789012
- GCP内部の数値ID
- Workload Identity で使用
```

### GitHub Secrets の設定方法

1. リポジトリ → Settings → Secrets and variables → Actions
2. 「New repository secret」
3. 名前と値を入力 → 「Add secret」

---

## Workload Identity

### 📚 学習ポイント: なぜ Workload Identity？

```
【従来: サービスアカウントキー】
1. JSONキーファイルをダウンロード
2. GitHub Secrets に保存
3. ワークフローで認証
⚠️ キーファイルの漏洩リスク

【推奨: Workload Identity】
1. GitHub と GCP を直接連携
2. キーファイル不要
3. 短命トークンで認証
✅ セキュリティが高い
```

### 設定（Terraform）

```hcl
# workload-identity.tf
resource "google_iam_workload_identity_pool" "github_actions" {
  workload_identity_pool_id = "github-actions-pool"
  display_name              = "GitHub Actions Pool"
}

resource "google_iam_workload_identity_pool_provider" "github_provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_actions.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub Actions Provider"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }

  # セキュリティ: このリポジトリからのみ認証を許可
  attribute_condition = "assertion.repository == '${var.github_repository}'"
}
```

`attribute_condition` は必須の1行です。GitHub のトークンの発行元（`token.actions.githubusercontent.com`）は全リポジトリで共通なので、条件がないと他のリポジトリのトークンでもプールでの交換が通ってしまいます。さらに堅くするなら、名前ではなく数値 ID（`assertion.repository_id`）で絞ります。

---

## トリガー条件

### 📚 学習ポイント: paths フィルター

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'web/**'           # web/ 配下の変更でトリガー
      - '!**/*.md'         # ただし .md ファイルは除外
```

| 変更ファイル | トリガー |
|------------|---------|
| web/src/app/page.tsx | ✅ 実行 |
| web/README.md | ❌ スキップ |
| terraform/main.tf | ❌ スキップ |

---

## デプロイフロー

### PR 作成時

```
1. web/ 配下のファイルを変更
2. PR を作成
3. build ジョブが実行（Docker イメージをビルド）
4. ビルド成功を確認 → マージ可能
```

### main マージ時

```
1. PR をマージ
2. build ジョブ: Docker イメージをビルド & プッシュ
3. deploy ジョブ: コミット SHA のイメージを指定して Cloud Run にデプロイ
4. ヘルスチェック: /api/health を確認
5. 完了: デプロイ URL を出力
```

### 📚 学習ポイント: Secret 注入フロー

```
【初期の方式】
1. terraform.tfvars にシークレット値を記載
2. terraform apply でSecret Managerに保存
⚠️ Git漏洩リスク・tfstate に平文で残る

【2026-02 までの方式】
1. GitHub Secrets に登録（Settings → Secrets and variables → Actions）
2. GitHub Actions がデプロイのたびに Secret Manager に注入
3. Cloud Run が Secret Manager から取得

【現在の方式（bcc0617 で注入ステップを削除）】
1. gcloud secrets versions add で Secret Manager に直接登録
2. Cloud Run がインスタンス起動時に Secret Manager から読み込む
✅ コードベースにも今の tfstate にもシークレット値が存在しない
   （それ以前の方式で値が入った古い state が prefix kabu-news-ai 側に
   残っていたが、2026-09-24 に削除した）
※ GitHub Secrets は Docker ビルド時の値（NEXT_PUBLIC_* と、ビルド中だけ使う
   SUPABASE_SERVICE_ROLE_KEY）の受け渡しにだけ使う
```

---

## トラブルシューティング

### ビルドエラー: キャッシュ問題

```bash
# GitHub Actions キャッシュをクリア
# Settings → Actions → General → Artifact and log retention → Delete all caches
```

### デプロイエラー: 権限不足

```
Error: Permission 'run.services.update' denied
```

**解決策**: デプロイ用 SA（`github-actions-deploy`）に、対象サービスの `roles/run.developer` が付与されているか確認する。`iam.serviceaccounts.actAs` で拒否される場合は、実行用 SA（`cloud-run-app`）に対する `roles/iam.serviceAccountUser` を確認する。`Cloud Run Admin` はサービスの IAM ポリシーまで変更できる強い権限なので、最小権限の観点から付与しない

### ヘルスチェック失敗

```
curl: (22) The requested URL returned error: 503
```

**解決策**:
1. Cloud Run のログを確認
2. 環境変数が正しく設定されているか確認
3. アプリケーションのエラーを修正

---

## 関連ドキュメント

- [GCP設定](../setup/GCP.md) - Workload Identity の詳細設定
- [環境変数](../setup/SECRETS.md) - シークレットの設定
- [Terraform](../development/TERRAFORM.md) - インフラの管理
