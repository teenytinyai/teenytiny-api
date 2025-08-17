variable "environment" {
  description = "Environment name (prod, qa, staging, etc.)"
  type        = string
}

variable "domain" {
  description = "Domain for this environment"
  type        = string
}

variable "worker_name" {
  description = "Cloudflare Worker name"
  type        = string
}

variable "zone_name" {
  description = "Cloudflare zone name"
  type        = string
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}