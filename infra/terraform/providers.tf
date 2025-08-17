terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
  
  # R2 Remote State Backend
  backend "s3" {
    endpoint = "https://74200eae33313459882c57f6ae0fbe2e.r2.cloudflarestorage.com"
    bucket   = "terraform-state-teenytiny-ai"
    region   = "auto"
    
    # R2-specific configuration
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum           = true
    force_path_style           = true
  }
}

# Configure the Cloudflare Provider
provider "cloudflare" {
  # Uses CLOUDFLARE_API_TOKEN environment variable
  # Get your API token from: https://dash.cloudflare.com/profile/api-tokens
}