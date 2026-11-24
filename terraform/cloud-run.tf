# cloud-run.tf - Cloud Run Service for Next.js App

# Artifact Registry - コンテナイメージを保存
resource "google_artifact_registry_repository" "app" {
  location      = var.region
  repository_id = local.project_name
  format        = "DOCKER"
  description   = "Docker repository for ${local.project_name} app"
  labels        = local.common_labels

  depends_on = [google_project_service.apis]
}

# Cloud Run用サービスアカウント
resource "google_service_account" "cloud_run" {
  account_id   = "cloud-run-app"
  display_name = "Cloud Run App"
  description  = "Service account for Cloud Run application"
}

# Note: Secret Manager 権限は secrets.tf で個別に付与（最小権限の原則）

# Cloud Run Service
resource "google_cloud_run_v2_service" "app" {
  name     = local.project_name
  location = var.region
  labels   = local.common_labels

  template {
    service_account = google_service_account.cloud_run.email

    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }

    containers {
      image = local.cloud_run_image

      ports {
        container_port = var.container_port
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle          = true # CPUを常時割り当てない（コスト削減）
        startup_cpu_boost = true # 起動時のみCPUブースト
      }

      startup_probe {
        http_get {
          path = "/api/health"
          port = var.container_port
        }
        initial_delay_seconds = 5
        period_seconds        = 10
        timeout_seconds       = 5
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/api/health"
          port = var.container_port
        }
        period_seconds    = 30
        timeout_seconds   = 5
        failure_threshold = 3
      }

      # Secret Managerから取得する環境変数
      env {
        name = "NEXT_PUBLIC_SUPABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.supabase_url.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.supabase_anon_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "SUPABASE_SERVICE_ROLE_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.supabase_service_role_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "GOOGLE_GENAI_USE_VERTEXAI"
        value = "true"
      }

      env {
        name  = "GOOGLE_CLOUD_LOCATION"
        value = var.region
      }

      env {
        name = "SLACK_WEBHOOK_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.slack_webhook_url.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "SEARCH_CONSOLE_SITE_URL"
        value = var.search_console_site_url
      }

      env {
        name  = "GA4_PROPERTY_ID"
        value = var.ga4_property_id
      }

      env {
        name  = "INDEXNOW_API_KEY"
        value = var.indexnow_api_key
      }
    }

    timeout = "300s"
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      template[0].labels,
    ]
  }

  depends_on = [
    google_project_service.apis,
    google_artifact_registry_repository.app,
    google_secret_manager_secret.supabase_url,
    google_secret_manager_secret.supabase_anon_key,
    google_secret_manager_secret.supabase_service_role_key,
    google_secret_manager_secret.slack_webhook_url,
  ]
}

# Cloud Runを公開（認証なしでアクセス可能）
# APIエンドポイントはアプリケーション層で認証
resource "google_cloud_run_v2_service_iam_member" "public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.app.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
