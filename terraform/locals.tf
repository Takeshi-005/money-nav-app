# locals.tf - Local Values
#
# ハードコードされた値を集約し、DRY原則を適用

locals {
  # プロジェクト名（リソース命名に使用）
  project_name = "kabu-news-ai"

  # Artifact Registry URL
  artifact_registry_url = "${var.region}-docker.pkg.dev/${var.project_id}"

  # Cloud Run イメージURL
  cloud_run_image = "${local.artifact_registry_url}/${local.project_name}/app:${var.app_image_tag}"

  # 共通ラベル（GCPコンソールでのフィルタリング用）
  # Cloud Scheduler の OIDC トークンの宛先(audience)。アプリ側でも同じ値で確かめる
  scheduler_oidc_audience = "${local.project_name}-cloud-scheduler"

  common_labels = {
    project    = local.project_name
    managed_by = "terraform"
  }
}
