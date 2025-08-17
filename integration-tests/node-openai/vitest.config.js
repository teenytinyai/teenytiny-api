import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 10000, // 10 second timeout for all tests
    reporters: [['junit', { 
      outputFile: '../reports/node-openai.xml', 
      suiteName: 'node-openai',
      classNameTemplate: 'node-openai',
      suiteNameTemplate: 'node-openai'
    }]],
  },
});