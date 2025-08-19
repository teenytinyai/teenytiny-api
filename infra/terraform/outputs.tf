output "domain" {
  description = "The domain for this environment"
  value       = var.domain
}

output "worker_name" {
  description = "The Cloudflare Worker name"
  value       = var.worker_name
}

output "worker_url" {
  description = "The Worker URL"
  value       = "https://${var.domain}"
}

output "health_check_url" {
  description = "Health check endpoint"
  value       = "https://${var.domain}/health"
}

output "pages_domain_id" {
  description = "Cloudflare Pages custom domain ID"
  value       = cloudflare_pages_domain.website.id
}

output "pages_project_name" {
  description = "Cloudflare Pages project name"
  value       = cloudflare_pages_project.website.name
}

output "pages_url" {
  description = "Cloudflare Pages website URL"
  value       = "https://${var.domain}"
}

output "pages_subdomain" {
  description = "Cloudflare Pages fallback subdomain"
  value       = "https://${cloudflare_pages_project.website.subdomain}"
}