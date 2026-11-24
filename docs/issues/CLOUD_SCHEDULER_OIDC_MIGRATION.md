# CLOUD-001: Cloud Scheduler OIDC移行

| 項目 | 内容 |
|---|---|
| 深刻度 | Critical |
| ステータス | 解決済み |
| 発見日 | 2026-02-20 |
| 解決日 | 2026-02-20 |
| 影響範囲 | Terraform インフラ・Cloud Scheduler 認証・cron エンドポイント（4本） |

---

## 問題の概要

Cloud Scheduler が Bearer `${CRON_SECRET}` ヘッダーで cron エンドポイントを呼び出していた。
Terraform が `data "google_secret_manager_secret_version"` でシークレット値を読み取るため、
Secret Manager で暗号化していたにも関わらず **tfstate ファイルに平文で書き込まれていた**。

---

## 根本原因

Terraform の `data source` は外部から取得した値をそのまま tfstate に記録する仕様がある。

```hcl
# ⚠️ 問題のある実装
data "google_secret_manager_secret_version" "cron_secret" {
  secret  = google_secret_manager_secret.cron_secret.id
  version = "latest"
}

# tfstate 内に以下のように平文で記録される:
# "secret_data": "aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7="
```

GCS バックエンドに state を保存していた場合、バケットの閲覧権限を持つ者は
Secret Manager で保護しているシークレット値を tfstate から直接読めた。

さらに CRON_SECRET は：
- 期限なし（リプレイアタックを防げない）
- 共有シークレット（呼び出し元を特定できない）
- ローテーションに Terraform Plan/Apply が必要

という問題も持っていた。

---

## 解決策

Cloud Scheduler の認証を **Bearer トークン → GCP OIDC トークン**に移行。

```
【移行前】
Terraform
  → data source で CRON_SECRET を読み取り
  → tfstate に平文で記録（漏洩リスク）
  → Cloud Scheduler の Authorization ヘッダーに展開

【移行後】
Cloud Scheduler（api-scheduler SA）
  → Google が OIDC トークンを自動生成・署名
  → Cloud Run がトークンを受信
  → verifySchedulerToken() で Google 公開鍵により JWT 署名を検証
```

`data source` 自体を廃止することで、tfstate へのシークレット記録を根本から解消した。
`api-scheduler` SA はすでに `roles/run.invoker` を保持していたため、IAM 変更は不要だった。

> 📝 **その後の検証（2026-09-24）**
>
> - `data source` を消すと、次の apply 以降の state には値が書かれなくなる。ただし、それ以前にできたコピーには値が残る。本構成でも、prefix `kabu-news-ai` 側に残った古い state（2026-02-11 時点）とローカルの state バックアップに、CRON_SECRET を含むシークレットが平文で残っていた（2026-09-24 に削除）。「解消」と言えるのは、古いコピーを消し、漏れた可能性のある値をローテーションしてから
> - IAM 変更が不要だった本当の理由は、`allUsers` に `run.invoker` を付けて公開しているため、Cloud Run の IAM がリクエストを止めないから。`api-scheduler` の `run.invoker` は門番として効いていない。OIDC トークンを付けたジョブを作るのに実際に必要なのは、ジョブを作る人（Terraform の実行者）が `api-scheduler` に対する `iam.serviceAccounts.actAs` を持つことと、Cloud Scheduler のサービスエージェントの権限（API の有効化時に自動で付与される）
> - `verifyIdToken` に `audience` を渡していないため、トークンの宛先は照合していない。Terraform で `audience = Cloud Run の URI` を設定しているので、アプリ側でも同じ値を渡して照合するのがより堅い形

---

## 変更ファイル

### `terraform/cloud-scheduler.tf`

```hcl
# Before
http_target {
  headers = {
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer ${data.google_secret_manager_secret_version.cron_secret.secret_data}"
  }
}

# After（全4ジョブで統一）
http_target {
  headers = {
    "Content-Type" = "application/json"
  }
  oidc_token {
    service_account_email = google_service_account.scheduler.email
    audience              = google_cloud_run_v2_service.app.uri
  }
}
```

### `terraform/secrets.tf`

以下を削除：
- `data "google_secret_manager_secret_version" "cron_secret"` リソース
- `google_secret_manager_secret.cron_secret` リソース
- Cloud Run SA の cron_secret アクセス権限バインディング

### `terraform/cloud-run.tf`

```hcl
# Before
env {
  name = "CRON_SECRET"
  value_source {
    secret_key_ref {
      secret  = google_secret_manager_secret.cron_secret.secret_id
      version = "latest"
    }
  }
}

# After
env {
  name  = "GCP_PROJECT_ID"
  value = var.project_id
}
```

### `web/src/shared/lib/verify-scheduler-token.ts`（新規作成）

```typescript
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client();

export async function verifySchedulerToken(
  authHeader: string | null,
): Promise<boolean> {
  if (!authHeader?.startsWith("Bearer ")) return false;

  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) return false;

  const schedulerEmail = `api-scheduler@${projectId}.iam.gserviceaccount.com`;
  const token = authHeader.slice(7);

  const ticket = await client.verifyIdToken({ idToken: token });
  const payload = ticket.getPayload();

  return payload?.email === schedulerEmail && payload?.email_verified === true;
}
```

`verifyIdToken()` が Google 公開鍵で JWT 署名を検証し、
`payload.email` が Scheduler SA のメールと一致するかを確認する。

---

## 影響を受けたドキュメント

| ドキュメント | 変更内容 |
|---|---|
| `docs/setup/SECRETS.md` | `CRON_SECRET` 削除 → `GCP_PROJECT_ID` セクション追加 |
| `docs/reference/API.md` | cron エンドポイント認証を `Cloud Scheduler OIDC` に更新 |
| `docs/deployment/IAC_REVIEW.md` | スコアを 8.5/10 → 9.0/10 に更新、解決済み項目追加 |
| `docs/development/TERRAFORM.md` | state セキュリティセクション追加 |

---

## 教訓・再発防止

### Terraform で Secret Manager の値を読み取ってはならない

`data "google_secret_manager_secret_version"` は tfstate に平文で記録される。
シークレット値を Terraform コード上で扱わない設計が必要。

| 目的 | NG パターン | OK パターン |
|------|------------|------------|
| Cloud Run への環境変数 | `data source` で値を展開 | `secret_key_ref` で環境変数として参照（Cloud Run が起動時に取得） |
| Cloud Scheduler の認証 | Bearer トークンをヘッダーに設定 | `oidc_token` ブロックで SA 認証 |
| CI/CD での Secret 注入 | `data source` で読んで output に出力 | `gcloud secrets versions add` で直接注入 |

### `secret_key_ref` は安全な理由

Cloud Run が**ランタイムで**Secret Manager から値を取得するため、Terraform は値を読み取らない。
tfstate には Secret Manager の「リソース名」のみ記録され、値は含まれない。

---

## 関連ドキュメント

- [IaC 設計レビュー](../deployment/IAC_REVIEW.md) - セキュリティスコア 9.0/10
- [Terraform 開発ガイド](../development/TERRAFORM.md) - state セキュリティセクション
- [環境変数・シークレット](../setup/SECRETS.md) - GCP_PROJECT_ID 設定
- [API リファレンス](../reference/API.md) - cron エンドポイント認証仕様
