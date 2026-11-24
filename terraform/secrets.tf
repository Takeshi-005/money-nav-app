# secrets.tf - Secret Manager Configuration
#
# シークレットの値は Terraform では扱わない（tfstate に平文で残るため）。
# 値は gcloud secrets versions add で直接登録する（下の「Secret Versions」参照）

# ===========================================
# Secret Manager Secrets
# ===========================================

resource "google_secret_manager_secret" "supabase_url" {
  secret_id = "supabase-url"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret" "supabase_anon_key" {
  secret_id = "supabase-anon-key"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret" "supabase_service_role_key" {
  secret_id = "supabase-service-role-key"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret" "slack_webhook_url" {
  secret_id = "slack-webhook-url"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

# ===========================================
# Secret Versions (値の設定)
# ===========================================
#
# Secret の値は Terraform で管理しません。
# Secret の値は GCP コンソールまたは gcloud CLI で手動管理します。
# 更新方法: echo "値" | gcloud secrets versions add SECRET_ID --data-file=- --project=ai-product-446711

# ===========================================
# IAM Bindings (最小権限の原則)
# Cloud Run SAに個別のSecretへのアクセス権を付与
# ===========================================

resource "google_secret_manager_secret_iam_member" "cloud_run_supabase_url" {
  secret_id = google_secret_manager_secret.supabase_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_secret_manager_secret_iam_member" "cloud_run_supabase_anon_key" {
  secret_id = google_secret_manager_secret.supabase_anon_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_secret_manager_secret_iam_member" "cloud_run_supabase_service_role_key" {
  secret_id = google_secret_manager_secret.supabase_service_role_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_secret_manager_secret_iam_member" "cloud_run_slack_webhook_url" {
  secret_id = google_secret_manager_secret.slack_webhook_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}
