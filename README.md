# TeenyTiny AI

A lightweight, OpenAI-compatible chat completions API built for Cloudflare Workers and Node.js.

## What is this?

TeenyTiny AI is a drop-in replacement for OpenAI's chat completions API that can run anywhere - from Cloudflare's edge network to your local development environment. It's designed for developers who need a simple, reliable chat API that works with existing OpenAI-compatible tools and libraries.

**Who is this for?** Developers building AI-powered applications who want:
- A lightweight alternative to OpenAI's API
- Edge deployment capabilities with Cloudflare Workers  
- Local development without external dependencies
- Full control over their chat completion service

**Why choose TeenyTiny AI over alternatives?**
- 🚀 **Edge-first**: Designed for Cloudflare Workers with global low latency
- 🔧 **OpenAI Compatible**: Drop-in replacement for existing apps
- 📦 **Lightweight**: Minimal dependencies, fast cold starts
- 🛠️ **Developer Friendly**: Easy local development and testing
- 🔒 **Self-hosted**: Keep your data under your control

## Available Models

TeenyTiny AI includes three AI models accessible via the OpenAI-compatible API:

- **`echo`** - Simple text echoing for testing and debugging
- **`eliza`** - Classic Rogerian psychotherapist simulation (MIT 1966)
- **`parry`** - Paranoid patient simulation with emotional states (Stanford 1972)

For detailed information about each model's origins, algorithms, and behavior patterns, see **[MODELS.md](MODELS.md)**.

## Command Line Interface

TeenyTiny AI includes a simple CLI client for testing and interacting with your API:

```bash
# Show available models and usage
./tt

# One-shot completion
./tt echo "Hello, world!"

# Interactive mode
./tt echo
```

The CLI automatically connects to `http://localhost:8080` by default, or you can configure it with environment variables:

```bash
export TEENYTINY_URL=https://teenytiny.ai
export TEENYTINY_API_KEY=your-api-key
./tt echo "Hello from the cloud"
```

---

Built with ❤️ for the developer community. Questions? Open an issue on [GitHub](https://github.com/teenytinyai/teenytiny-api).
