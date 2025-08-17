# Get the zone data
data "cloudflare_zone" "main" {
  name = var.zone_name
}

# Create DNS A record for the domain
resource "cloudflare_record" "main" {
  zone_id         = data.cloudflare_zone.main.id
  name            = var.domain == var.zone_name ? "@" : replace(var.domain, ".${var.zone_name}", "")
  content         = "192.0.2.1"  # Placeholder IP - Workers will override this
  type            = "A"
  proxied         = true  # CRITICAL: Must be proxied for Workers to work
  ttl             = 1     # TTL of 1 means "automatic" when proxied
  allow_overwrite = true  # Allow overwriting existing records
  
  comment = "Managed by Terraform - TeenyTiny AI ${var.environment}"
}

# Worker routes are automatically managed by Wrangler via wrangler.toml
# This ensures better compatibility and reduces API permission requirements