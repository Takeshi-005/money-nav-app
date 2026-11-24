# outputs.tf - Output Values

output "app_url" {
  description = "Next.js App Cloud Run URL"
  value       = google_cloud_run_v2_service.app.uri
  sensitive   = false
}

output "artifact_registry_url" {
  description = "Artifact Registry URL for Docker images"
  value       = local.artifact_registry_url
  sensitive   = false
}

output "docker_image_url" {
  description = "Full Docker image URL for Cloud Run"
  value       = local.cloud_run_image
  sensitive   = false
}

output "scheduler_job_name" {
  description = "Cloud Scheduler job name for prediction generation"
  value       = google_cloud_scheduler_job.prediction_generator.name
  sensitive   = false
}

output "cloud_run_service_account" {
  description = "Cloud Run service account email"
  value       = google_service_account.cloud_run.email
  sensitive   = false
}

output "scheduler_service_account" {
  description = "Scheduler service account email"
  value       = google_service_account.scheduler.email
  sensitive   = false
}

# ===========================================
# GitHub Actions Outputs
# ===========================================

output "workload_identity_provider" {
  description = "Workload Identity Provider resource name for GitHub Actions"
  value       = google_iam_workload_identity_pool_provider.github_provider.name
  sensitive   = false
}

output "github_actions_service_account" {
  description = "GitHub Actions service account email"
  value       = google_service_account.github_actions.email
  sensitive   = false
}
