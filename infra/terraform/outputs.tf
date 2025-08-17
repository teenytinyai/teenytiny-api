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

output "dns_record_id" {
  description = "Cloudflare DNS record ID"
  value       = cloudflare_record.main.id
}