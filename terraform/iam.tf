# iam.tf - Service Accounts and IAM Bindings

# Cloud Scheduler用サービスアカウント
resource "google_service_account" "scheduler" {
  account_id   = "api-scheduler"
  display_name = "Cloud Scheduler for API"
  description  = "Service account for Cloud Scheduler to invoke API Routes"
}

# Cloud Run SA に Vertex AI 呼び出し権限を付与
resource "google_project_iam_member" "cloud_run_vertex_ai" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Scheduler SA に Cloud Run 起動権限を付与
# これがないと Cloud Scheduler が Cloud Run を呼び出せない
resource "google_cloud_run_v2_service_iam_member" "scheduler_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.app.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.scheduler.email}"
}

# 開発者がローカルで cloud-run-app SA を Impersonation するための権限
resource "google_service_account_iam_member" "developer_impersonation" {
  service_account_id = google_service_account.cloud_run.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "user:${var.developer_email}"
}
