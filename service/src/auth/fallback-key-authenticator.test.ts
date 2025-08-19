import { describe, it, expect } from 'vitest';
import { FallbackKeyAuthenticator } from './fallback-key-authenticator.js';
import { EncryptedKeyAuthenticator } from './encrypted-key-authenticator.js';
import { SingleKeyAuthenticator } from './single-key-authenticator.js';
import type { Authenticator } from './authenticator.js';

describe('FallbackKeyAuthenticator', () => {
  const testSecret = 'test-secret-for-fallback';
  const fixedTimestamp = 1755577740000;
  
  // Create fixed IV generator for deterministic encrypted keys
  const createFixedIV = (value: number) => () => {
    const iv = new Uint8Array(12);
    const view = new DataView(iv.buffer);
    view.setUint32(0, value, false);
    return iv;
  };

  // Create test authenticators
  const createEncryptedAuth = () => new EncryptedKeyAuthenticator(
    testSecret, 
    () => fixedTimestamp, 
    createFixedIV(0x12345678)
  );
  
  const createSingleKeyAuth = (apiKey: string) => new SingleKeyAuthenticator(apiKey);

  describe('constructor', () => {
    it('should accept single authenticator', async () => {
      const auth = createEncryptedAuth();
      const fallback = new FallbackKeyAuthenticator([auth]);
      
      // Should be able to generate keys (basic smoke test)
      const key = await fallback.generateApiKey();
      expect(key).toMatch(/^tt-2/);
    });

    it('should accept multiple authenticators', async () => {
      const primary = createEncryptedAuth();
      const fallback1 = createSingleKeyAuth('key1');
      const fallback2 = createSingleKeyAuth('key2');
      
      const fallback = new FallbackKeyAuthenticator([primary, fallback1, fallback2]);
      
      // Should be able to generate keys using primary
      const key = await fallback.generateApiKey();
      expect(key).toMatch(/^tt-2/);
    });

    it('should require at least one authenticator', () => {
      expect(() => new FallbackKeyAuthenticator([])).toThrow('At least one authenticator is required');
    });
  });

  describe('generateApiKey', () => {
    it('should always use primary authenticator for generation', async () => {
      const primary = createEncryptedAuth();
      const fallback1 = createSingleKeyAuth('fallback-key-1');
      const fallback2 = createSingleKeyAuth('fallback-key-2');
      
      const compositeAuth = new FallbackKeyAuthenticator([primary, fallback1, fallback2]);
      
      const key = await compositeAuth.generateApiKey();
      
      // Should generate encrypted key (primary), not hardcoded keys (fallbacks)
      expect(key).toMatch(/^tt-2/);
      expect(key).not.toBe('fallback-key-1');
      expect(key).not.toBe('fallback-key-2');
      
      // Should be able to validate with primary
      expect(await primary.validateApiKey(key)).toBe(true);
    });

    it('should generate consistent keys from primary', async () => {
      const primary = createEncryptedAuth();
      const fallback1 = createSingleKeyAuth('fallback-key');
      
      const compositeAuth = new FallbackKeyAuthenticator([primary, fallback1]);
      
      const key1 = await compositeAuth.generateApiKey();
      const key2 = await compositeAuth.generateApiKey();
      
      // With fixed timestamp and IV, should be identical
      expect(key1).toBe(key2);
    });
  });

  describe('validateApiKey', () => {
    it('should validate keys from primary authenticator', async () => {
      const primary = createEncryptedAuth();
      const fallback1 = createSingleKeyAuth('fallback-key');
      
      const compositeAuth = new FallbackKeyAuthenticator([primary, fallback1]);
      
      const key = await primary.generateApiKey();
      expect(await compositeAuth.validateApiKey(key)).toBe(true);
    });

    it('should validate keys from fallback authenticators', async () => {
      const primary = createEncryptedAuth();
      const fallback1 = createSingleKeyAuth('fallback-key-1');
      const fallback2 = createSingleKeyAuth('fallback-key-2');
      
      const compositeAuth = new FallbackKeyAuthenticator([primary, fallback1, fallback2]);
      
      // Should validate fallback keys
      expect(await compositeAuth.validateApiKey('fallback-key-1')).toBe(true);
      expect(await compositeAuth.validateApiKey('fallback-key-2')).toBe(true);
    });

    it('should try primary first, then fallbacks in order', async () => {
      const primary = createEncryptedAuth();
      const fallback1 = createSingleKeyAuth('fallback-key-1');
      const fallback2 = createSingleKeyAuth('fallback-key-2');
      
      const compositeAuth = new FallbackKeyAuthenticator([primary, fallback1, fallback2]);
      
      // Primary key should work
      const primaryKey = await primary.generateApiKey();
      expect(await compositeAuth.validateApiKey(primaryKey)).toBe(true);
      
      // Fallback keys should work
      expect(await compositeAuth.validateApiKey('fallback-key-1')).toBe(true);
      expect(await compositeAuth.validateApiKey('fallback-key-2')).toBe(true);
      
      // Invalid key should fail
      expect(await compositeAuth.validateApiKey('invalid-key')).toBe(false);
    });

    it('should handle authenticator errors gracefully', async () => {
      // Create a mock authenticator that throws errors
      const errorAuth: Authenticator = {
        generateApiKey: async () => 'error-key',
        validateApiKey: async () => {
          throw new Error('Validation error');
        }
      };
      
      const fallback1 = createSingleKeyAuth('fallback-key');
      
      const compositeAuth = new FallbackKeyAuthenticator([errorAuth, fallback1]);
      
      // Should continue to fallback even if primary throws error
      expect(await compositeAuth.validateApiKey('fallback-key')).toBe(true);
      expect(await compositeAuth.validateApiKey('invalid-key')).toBe(false);
    });

    it('should return false when no authenticator validates', async () => {
      const primary = createEncryptedAuth();
      const fallback1 = createSingleKeyAuth('fallback-key-1');
      const fallback2 = createSingleKeyAuth('fallback-key-2');
      
      const compositeAuth = new FallbackKeyAuthenticator([primary, fallback1, fallback2]);
      
      expect(await compositeAuth.validateApiKey('completely-invalid-key')).toBe(false);
    });
  });

  describe('migration scenarios', () => {
    it('should support gradual migration from hardcoded to encrypted keys', async () => {
      // Simulate migration: new encrypted keys, but still accept old hardcoded key
      const encryptedAuth = createEncryptedAuth();
      const oldHardcodedAuth = createSingleKeyAuth('old-production-key');
      
      const migrationAuth = new FallbackKeyAuthenticator([encryptedAuth, oldHardcodedAuth]);
      
      // New keys generated are encrypted
      const newKey = await migrationAuth.generateApiKey();
      expect(newKey).toMatch(/^tt-2/);
      expect(await migrationAuth.validateApiKey(newKey)).toBe(true);
      
      // Old hardcoded key still works
      expect(await migrationAuth.validateApiKey('old-production-key')).toBe(true);
      
      // Invalid keys still fail
      expect(await migrationAuth.validateApiKey('random-invalid-key')).toBe(false);
    });

    it('should support multiple legacy key formats', async () => {
      const primary = createEncryptedAuth();
      const legacyV1 = createSingleKeyAuth('legacy-v1-key');
      const legacyV2 = createSingleKeyAuth('legacy-v2-key');
      const devKey = createSingleKeyAuth('dev-test-key');
      
      const multiAuth = new FallbackKeyAuthenticator([primary, legacyV1, legacyV2, devKey]);
      
      // All legacy formats should work
      expect(await multiAuth.validateApiKey('legacy-v1-key')).toBe(true);
      expect(await multiAuth.validateApiKey('legacy-v2-key')).toBe(true);
      expect(await multiAuth.validateApiKey('dev-test-key')).toBe(true);
      
      // New encrypted keys should work
      const newKey = await multiAuth.generateApiKey();
      expect(await multiAuth.validateApiKey(newKey)).toBe(true);
    });
  });

  describe('real-world integration', () => {
    it('should handle typical production setup', async () => {
      // Typical production: encrypted primary + hardcoded fallback for emergency
      const encryptedAuth = new EncryptedKeyAuthenticator('production-secret');
      const emergencyAuth = createSingleKeyAuth('emergency-access-key-2024');
      
      const prodAuth = new FallbackKeyAuthenticator([encryptedAuth, emergencyAuth]);
      
      // Generate new encrypted key
      const apiKey = await prodAuth.generateApiKey();
      expect(apiKey).toMatch(/^tt-2/);
      expect(apiKey.length).toBeLessThan(60); // Should be ~52 chars
      
      // Validate new key
      expect(await prodAuth.validateApiKey(apiKey)).toBe(true);
      
      // Emergency key still works
      expect(await prodAuth.validateApiKey('emergency-access-key-2024')).toBe(true);
      
      // Invalid keys fail
      expect(await prodAuth.validateApiKey('hacker-attempt')).toBe(false);
    });
  });
});