// Test setup file to polyfill missing globals

import { webcrypto } from 'node:crypto';

// Polyfill crypto for older Node.js versions
if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = webcrypto;
}