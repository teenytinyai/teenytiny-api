#!/usr/bin/env node

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { createApp } from './app.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_PORT = 8080;
const DEFAULT_API_KEY = 'testkey';

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    port: DEFAULT_PORT,
    apiKey: DEFAULT_API_KEY,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--port':
      case '-p':
        if (nextArg && !isNaN(Number(nextArg))) {
          config.port = Number(nextArg);
          i++; // Skip next argument
        } else {
          console.error('Error: --port requires a numeric value');
          process.exit(1);
        }
        break;
      
      case '--api-key':
        if (nextArg) {
          config.apiKey = nextArg;
          i++; // Skip next argument
        } else {
          console.error('Error: --api-key requires a value');
          process.exit(1);
        }
        break;
      
      case '--help':
      case '-h':
        config.help = true;
        break;
      
      default:
        console.error(`Error: Unknown argument ${arg}`);
        process.exit(1);
    }
  }

  return config;
}

function showHelp() {
  console.log('TeenyTiny AI - OpenAI Compatible Chat Completions API');
  console.log('');
  console.log('Usage: npm run dev [options]');
  console.log('       node dist/server.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --port, -p <port>     Port to run the server on (default: 8080)');
  console.log('  --api-key <key>       API key for authentication (default: testkey)');
  console.log('  --help, -h            Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  npm run dev                    # Run on default port 8080');
  console.log('  npm run dev -- --port 3000     # Run on port 3000');
  console.log('');
  console.log('API Usage:');
  console.log(`  curl -X POST http://localhost:${DEFAULT_PORT}/v1/chat/completions \\`);
  console.log(`    -H 'Authorization: Bearer ${DEFAULT_API_KEY}' \\`);
  console.log(`    -H 'Content-Type: application/json' \\`);
  console.log(`    -d '{"model": "echo", "messages": [{"role": "user", "content": "Hello!"}]}'`);
  console.log('');
  console.log('  llm -m echo "Hello!" # Using llm tool (configure with: llm keys set teenytiny)');
}

function maskAPIKey(key: string): string {
  if (key.length <= 6) {
    return '***';
  }
  return key.slice(0, 6) + '***';
}

async function main() {
  const config = parseArgs();

  if (config.help) {
    showHelp();
    process.exit(0);
  }

  // Create the app
  const app = createApp({
    auth: {
      apiKey: config.apiKey,
    },
  });

  // Add static file serving for development (Node.js only)
  const websiteRoot = path.resolve(__dirname, '../../website');
  app.use('/*', serveStatic({ root: websiteRoot }));

  console.log(JSON.stringify({
    level: 'info',
    message: 'Starting TeenyTiny AI server',
    port: config.port,
    api_key: maskAPIKey(config.apiKey),
  }));

  // Start the server
  serve({
    fetch: app.fetch,
    port: config.port,
  });

  console.log(JSON.stringify({
    level: 'info',
    message: 'Server started successfully',
    address: `http://localhost:${config.port}`,
    health_check: `http://localhost:${config.port}/health`,
    models_endpoint: `http://localhost:${config.port}/v1/models`,
    chat_endpoint: `http://localhost:${config.port}/v1/chat/completions`,
  }));

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log(JSON.stringify({
      level: 'info',
      message: 'Server shutting down gracefully...',
    }));
    
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log(JSON.stringify({
      level: 'info',
      message: 'Server shutting down gracefully...',
    }));
    
    process.exit(0);
  });
}

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}