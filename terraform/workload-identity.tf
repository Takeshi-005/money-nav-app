# workload-identity.tf - Workload Identity Federation for GitHub Actions
#
# GitHub Actions から GCP への認証をサービスアカウントキーなしで行う設定
# 参考: https://cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines

# ===========================================
# IAM Credentials API を有効化（WIF に必要）
# ===========================================
resource "google_project_service" "iamcredentials" {
  service            = "iamcredentials.googleapis.com"
  disable_on_destroy = false
}

# ===========================================
# Workload Identity Pool
# ===========================================
resource "google_iam_workload_identity_pool" "github_actions" {
  workload_identity_pool_id = "github-actions-pool"
  display_name              = "GitHub Actions Pool"
  description               = "Workload Identity Pool for GitHub Actions CI/CD"
  disabled                  = false

  depends_on = [google_project_service.iamcredentials]
}

# ===========================================
# OIDC Provider
# ===========================================
resource "google_iam_workload_identity_pool_provider" "github_provider" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_actions.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub Actions Provider"
  description                        = "OIDC identity pool provider for GitHub Actions"

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

# ===========================================
# GitHub Actions 用サービスアカウント
# ===========================================
resource "google_service_account" "github_actions" {
  account_id   = "github-actions-deploy"
  display_name = "GitHub Actions Deploy"
  description  = "Service account for GitHub Actions CI/CD"
}

# WIF → SA へのバインディング（OIDC トークンで SA を使用可能に）
resource "google_service_account_iam_member" "github_actions_wif" {
  service_account_id = google_service_account.github_actions.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github_actions.name}/attribute.repository/${var.github_repository}"
}

# ===========================================
# IAM: 最小権限の原則
# ===========================================

# Artifact Registry への書き込み権限（Docker イメージ push 用）
resource "google_artifact_registry_repository_iam_member" "github_actions_writer" {
  project    = var.project_id
  location   = var.region
  repository = google_artifact_registry_repository.app.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.github_actions.email}"
}

# Cloud Run への開発者権限（デプロイ用）
resource "google_cloud_run_v2_service_iam_member" "github_actions_developer" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.app.name
  role     = "roles/run.developer"
  member   = "serviceAccount:${google_service_account.github_actions.email}"
}

# Cloud Run SA の使用権限（デプロイ時に Cloud Run が使う SA を指定するため）
resource "google_service_account_iam_member" "github_actions_sa_user" {
  service_account_id = google_service_account.cloud_run.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_actions.email}"
}
