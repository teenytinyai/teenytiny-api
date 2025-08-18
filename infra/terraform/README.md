# Terraform Wrapper

This directory contains a Terraform wrapper script that simplifies working with TeenyTiny AI infrastructure.

## Usage

Use the `./tf` script instead of calling `terraform` directly. It automatically:

- Sources environment variables from `../infra/.env`
- Sets up Cloudflare API credentials
- Configures R2 backend authentication
- Validates required environment variables

### Examples

```bash
# Plan changes
./tf plan -var="environment=qa" -var="domain=qa.teenytiny.ai" -var="worker_name=teenytiny-api-qa" -var="zone_name=teenytiny.ai" -var="cloudflare_account_id=your-account-id"

# Apply changes
./tf apply

# Show current state
./tf show

# Get outputs
./tf output

# Any other terraform command
./tf [command] [args...]
```

### Environment Variables Required

The wrapper expects these variables in `../infra/.env`:

```bash
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
```

### Why Use This?

- **Consistent environment**: Never forget to source .env or set credentials
- **Error prevention**: Validates all required vars before running terraform
- **Simplified workflow**: No need to remember complex export commands
- **Documentation**: Self-documenting with helpful error messages

### Integration with Deploy Script

The main deploy script (`../deploy`) uses this pattern internally, so manual terraform operations stay consistent with automated deployments.