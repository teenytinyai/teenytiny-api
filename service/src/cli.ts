#!/usr/bin/env node

import { createInterface } from "node:readline";
import { stdin, stdout, stderr } from "node:process";

const DEFAULT_BASE_URL = "http://localhost:8080";
const DEFAULT_API_KEY = "testkey";

interface CliConfig {
  baseUrl: string;
  apiKey: string;
}

function getConfig(): CliConfig {
  return {
    baseUrl: process.env.TEENYTINY_URL || DEFAULT_BASE_URL,
    apiKey: process.env.TEENYTINY_API_KEY || DEFAULT_API_KEY,
  };
}

async function listModels(config: CliConfig): Promise<void> {
  try {
    const response = await fetch(`${config.baseUrl}/v1/models`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      stderr.write(`Error ${response.status}: ${errorText}\n`);
      process.exit(1);
    }

    const data = (await response.json()) as { data: Array<{ id: string }> };

    console.log("tt - TeenyTiny AI client. See https://teenytiny.ai\n");

    console.log("Available models:");
    for (const model of data.data) {
      console.log(`  ${model.id}`);
    }

    console.log(`\nUsage:`);
    console.log(`  tt <model> "message"   - One-shot completion`);
    console.log(`  tt <model>             - Interactive mode`);
    console.log(`  tt                     - Show this help`);

    console.log(`\nAuthor: Joe Walnes <joe@walnes.com>`);
  } catch (error) {
    stderr.write(
      `Failed to connect to TeenyTiny API: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    stderr.write(`Make sure the server is running at ${config.baseUrl}\n`);
    process.exit(1);
  }
}

async function streamCompletion(
  config: CliConfig,
  model: string,
  message: string,
): Promise<void> {
  try {
    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: message }],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      stderr.write(`Error ${response.status}: ${errorText}\n`);
      process.exit(1);
    }

    if (!response.body) {
      stderr.write("No response body received\n");
      process.exit(1);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              stdout.write("\n");
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                stderr.write(`\nError: ${parsed.error.message}\n`);
                process.exit(1);
              }

              const delta = parsed.choices?.[0]?.delta;
              if (delta?.content) {
                stdout.write(delta.content);
              }
            } catch (parseError) {
              // Ignore parsing errors for malformed chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    stdout.write("\n");
  } catch (error) {
    stderr.write(
      `\nFailed to complete request: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exit(1);
  }
}

async function interactiveMode(
  config: CliConfig,
  model: string,
): Promise<void> {
  console.log(`Starting interactive mode with model: ${model}`);
  console.log("Type your message and press Enter. Press Ctrl+C to quit.\n");

  const rl = createInterface({
    input: stdin,
    output: stdout,
    prompt: "> ",
  });

  rl.prompt();

  rl.on("line", async (input: string) => {
    const trimmed = input.trim();

    if (trimmed === "") {
      rl.prompt();
      return;
    }

    try {
      await streamCompletion(config, model, trimmed);
      console.log(); // Add newline after completion
    } catch (error) {
      stderr.write(
        `Error: ${error instanceof Error ? error.message : String(error)}\n`,
      );
    }

    rl.prompt();
  });

  rl.on("SIGINT", () => {
    console.log();
    rl.close();
    process.exit(0);
  });

  rl.on("close", () => {
    process.exit(0);
  });
}

async function main(): Promise<void> {
  const config = getConfig();
  const args = process.argv.slice(2);

  // No arguments: show models and usage
  if (args.length === 0) {
    await listModels(config);
    return;
  }

  const model = args[0]!;

  // One argument: interactive mode
  if (args.length === 1) {
    await interactiveMode(config, model);
    return;
  }

  // Two arguments: one-shot completion
  if (args.length === 2) {
    const message = args[1]!;
    await streamCompletion(config, model, message);
    return;
  }

  // Too many arguments
  stderr.write("Usage:\n");
  stderr.write("  tt                     - List models and show usage\n");
  stderr.write('  tt <model> "message"   - One-shot completion\n');
  stderr.write("  tt <model>             - Interactive mode\n");
  process.exit(1);
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  stderr.write(
    `Unhandled error: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});

// Run main function
main().catch((error) => {
  stderr.write(
    `Fatal error: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});

