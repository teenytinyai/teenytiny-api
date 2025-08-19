# Get the zone data
data "cloudflare_zone" "main" {
  name = var.zone_name
}

# DNS will be managed automatically by Pages custom domain

# Cloudflare Pages project for static website
resource "cloudflare_pages_project" "website" {
  account_id        = var.cloudflare_account_id
  name             = "${var.worker_name}-website"
  production_branch = "main"

  # Build configuration
  build_config {
    build_command   = "echo 'Static files ready'"
    destination_dir = "website"
    root_dir        = ""
  }

  # Deployment configuration 
  deployment_configs {
    preview {
      compatibility_date = "2024-11-01"
    }
    production {
      compatibility_date = "2024-11-01"
    }
  }
}

# CNAME record for Pages domain verification
resource "cloudflare_record" "pages_verification" {
  zone_id         = data.cloudflare_zone.main.id
  name            = var.domain == var.zone_name ? "@" : replace(var.domain, ".${var.zone_name}", "")
  content         = "${cloudflare_pages_project.website.name}.pages.dev"
  type            = "CNAME"
  proxied         = true
  ttl             = 1
  allow_overwrite = true
  
  comment = "Pages domain verification - ${var.environment}"
}

# Custom domain for Pages - Pages manages DNS, Worker handles specific routes
resource "cloudflare_pages_domain" "website" {
  account_id   = var.cloudflare_account_id
  project_name = cloudflare_pages_project.website.name
  domain       = var.domain

  depends_on = [cloudflare_pages_project.website, cloudflare_record.pages_verification]
}

# Worker routes are automatically managed by Wrangler via wrangler.toml
# This ensures better compatibility and reduces API permission requirements