import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 10000, // 10 second timeout for all tests
    reporters: [['junit', { 
      outputFile: '../reports/node-vercel-ai-v5.xml', 
      suiteName: 'node-vercel-ai-v5',
      classNameTemplate: 'node-vercel-ai-v5',
      suiteNameTemplate: 'node-vercel-ai-v5'
    }]],
  },
});