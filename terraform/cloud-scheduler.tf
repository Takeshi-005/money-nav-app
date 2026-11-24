# cloud-scheduler.tf - Cloud Scheduler Jobs

# 予測トレーニング生成・解決（毎日9時 JST）
# 旧: quiz-generator → 予測トレーニングに置き換え
resource "google_cloud_scheduler_job" "prediction_generator" {
  name        = "prediction-generator"
  description = "Prediction training: reveal yesterday + generate today (09:00 JST daily). Paused for service shutdown (#77): Gemini の変動費を停止"
  schedule    = "0 9 * * *"
  time_zone   = "Asia/Tokyo"
  region      = var.region
  paused      = true

  http_target {
    uri         = "${google_cloud_run_v2_service.app.uri}/api/cron/generate-prediction"
    http_method = "POST"

    headers = {
      "Content-Type" = "application/json"
    }

    oidc_token {
      service_account_email = google_service_account.scheduler.email
      audience              = google_cloud_run_v2_service.app.uri
    }
  }

  retry_config {
    retry_count          = 2
    min_backoff_duration = "5s"
  }

  depends_on = [
    google_project_service.apis,
    google_cloud_run_v2_service.app,
  ]
}

# 用語辞典自動生成（毎週日曜0時）
resource "google_cloud_scheduler_job" "glossary_generator" {
  name        = "glossary-generator"
  description = "Auto-generate glossary terms weekly (00:00 JST every Sunday). Paused for SEO quality (#17): 飽和ヘッドワードの新規量産を停止"
  schedule    = "0 0 * * 0"
  time_zone   = "Asia/Tokyo"
  region      = var.region
  paused      = true

  http_target {
    uri         = "${google_cloud_run_v2_service.app.uri}/api/cron/generate-glossary-terms"
    http_method = "POST"

    headers = {
      "Content-Type" = "application/json"
    }

    oidc_token {
      service_account_email = google_service_account.scheduler.email
      audience              = google_cloud_run_v2_service.app.uri
    }
  }

  retry_config {
    retry_count          = 2
    min_backoff_duration = "30s"
  }

  depends_on = [
    google_project_service.apis,
    google_cloud_run_v2_service.app,
  ]
}

# SEOデータ収集（毎週月曜9時）
resource "google_cloud_scheduler_job" "seo_data_collector" {
  name        = "seo-data-collector"
  description = "Collect SEO data from Search Console and GA4 (09:00 JST every Monday). Paused for service shutdown (#77): SEO 計測を終了"
  schedule    = "0 9 * * 1"
  time_zone   = "Asia/Tokyo"
  region      = var.region
  paused      = true

  http_target {
    uri         = "${google_cloud_run_v2_service.app.uri}/api/cron/collect-seo-data"
    http_method = "POST"

    headers = {
      "Content-Type" = "application/json"
    }

    oidc_token {
      service_account_email = google_service_account.scheduler.email
      audience              = google_cloud_run_v2_service.app.uri
    }
  }

  retry_config {
    retry_count          = 2
    min_backoff_duration = "5s"
  }

  depends_on = [
    google_project_service.apis,
    google_cloud_run_v2_service.app,
  ]
}
