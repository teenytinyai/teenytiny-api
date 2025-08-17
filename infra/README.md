# Infrastructure

Infrastructure deployment for TeenyTiny AI - OpenAI-compatible chat completions API.

## Environments

- **prod**: https://teenytiny.ai
- **qa**: https://qa.teenytiny.ai

All environments defined in `environments.yaml`. Add new environments there only.

## Architecture

- **Cloudflare Workers**: Application runtime
- **Cloudflare DNS**: Domain routing  
- **Terraform**: Infrastructure management with state in Cloudflare R2
- **Wrangler**: Application packaging and deployment

## Setup

1. **Install tools**:
   ```bash
   brew install terraform yq
   ```

2. **Configure credentials**:
   ```bash
   cp .env.example .env
   # Edit .env with your tokens
   ```

   Get credentials from:
   - Cloudflare API Token: https://dash.cloudflare.com/profile/api-tokens
   - R2 Credentials: Cloudflare Dashboard → R2 → Manage R2 API Tokens

## Commands

**Deploy environment:**
```bash
./deploy qa    # or prod
```

**Check environment health:**
```bash
./check qa     # or prod
```

