# variables.tf - Input Variables

variable "project_id" {
  description = "GCP Project ID where resources will be created"
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.project_id))
    error_message = "Project ID must be valid GCP format (6-30 chars, lowercase, hyphens allowed)"
  }
}

variable "region" {
  description = "GCP Region for resource deployment"
  type        = string
  default     = "asia-northeast1"

  validation {
    condition     = can(regex("^(asia|us|europe|australia|southamerica|northamerica)-[a-z]+[0-9]$", var.region))
    error_message = "Region must be a valid GCP region (e.g., asia-northeast1, us-central1)"
  }
}

# ===========================================
# Cloud Run Settings
# ===========================================

variable "app_image_tag" {
  description = "Docker image tag for Cloud Run (e.g., v1.0.0 or commit SHA). Must be specified explicitly."
  type        = string

  validation {
    condition     = length(var.app_image_tag) > 0 && var.app_image_tag != "latest"
    error_message = "app_image_tag must be specified and cannot be 'latest'. Use semantic version (v1.0.0) or commit SHA."
  }
}

variable "container_port" {
  description = "Container port for Cloud Run service"
  type        = number
  default     = 8080
}

# ===========================================
# Secrets
# ===========================================
#
# Secret の値は Terraform 変数として管理しません（tfstate に平文で残るため）。
# gcloud secrets versions add で Secret Manager に直接登録します。
# （2026-02-15 までは GitHub Actions が注入していた）
#
# 詳細: terraform/README.md の「Secret管理」セクション参照

# ===========================================
# GitHub Actions Settings
# ===========================================

variable "search_console_site_url" {
  description = "Search Console site URL (e.g., https://money-nav.com)"
  type        = string
}

variable "ga4_property_id" {
  description = "GA4 property ID (numeric, e.g., 123456789)"
  type        = string
}

variable "developer_email" {
  description = "Developer email for service account impersonation (local development)"
  type        = string
}

variable "indexnow_api_key" {
  description = "IndexNow API key for search engine notification"
  type        = string
}

variable "github_repository" {
  description = "GitHub repository in format 'owner/repo' for Workload Identity"
  type        = string
  default     = "Takeshi-005/kabu-news-ai"
}
