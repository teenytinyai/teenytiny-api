import { describe, it, expect } from 'vitest';
import { EncryptedKeyAuthenticator } from './encrypted-key-authenticator.js';

describe('EncryptedKeyAuthenticator', () => {
  const testSecret = 'test-secret-key-for-testing';
  const fixedTimestamp = 1755577740000;

  // Deterministic IV generator for testing (Web Crypto API uses Uint8Array)
  const createFixedIV = (value: number) => () => {
    const iv = new Uint8Array(12); // GCM uses 12-byte IV
    const view = new DataView(iv.buffer);
    view.setUint32(0, value, false); // First 4 bytes = value, big-endian
    return iv;
  };

  describe('generateApiKey', () => {
    it('should generate deterministic key with fixed timestamp and IV', async () => {
      const authenticator = new EncryptedKeyAuthenticator(testSecret, () => fixedTimestamp, createFixedIV(0x12345678));
      const key = await authenticator.generateApiKey();
      expect(key).toMatchInlineSnapshot(`"tt-2EjRWeAAAAAAAAAAA4-uIdG2T_lHVU-q9PwOtA6GMuZMXuisp"`);
    });

    it('should generate different keys with different timestamps', async () => {
      const auth1 = new EncryptedKeyAuthenticator(testSecret, () => fixedTimestamp, createFixedIV(0x11111111));
      const auth2 = new EncryptedKeyAuthenticator(testSecret, () => fixedTimestamp + 1000, createFixedIV(0x22222222));
      
      const key1 = await auth1.generateApiKey();
      const key2 = await auth2.generateApiKey();
      
      expect(key1).toMatchInlineSnapshot(`"tt-2EREREQAAAAAAAAAAwA0cGHanpHiWWGgHSIK5Wl-l6x1HCyzU"`);
      expect(key2).toMatchInlineSnapshot(`"tt-2IiIiIgAAAAAAAAAAAtkth-_Wdb9OkFgfyvhtEC9UOnQLpLfM"`);
      expect(key1).not.toBe(key2);
    });

    it('should generate keys with correct format prefix', async () => {
      const authenticator = new EncryptedKeyAuthenticator(testSecret, () => fixedTimestamp, createFixedIV(0x12345678));
      const key = await authenticator.generateApiKey();
      expect(key).toMatch(/^tt-2[A-Za-z0-9_-]+$/);
    });
  });

  describe('validateApiKey', () => {
    it('should validate deterministic key', async () => {
      const authenticator = new EncryptedKeyAuthenticator(testSecret, () => fixedTimestamp, createFixedIV(0x12345678));
      const key = await authenticator.generateApiKey();
      const isValid = await authenticator.validateApiKey(key);
      expect(isValid).toBe(true);
      expect(key).toMatchInlineSnapshot(`"tt-2EjRWeAAAAAAAAAAA4-uIdG2T_lHVU-q9PwOtA6GMuZMXuisp"`);
    });

    it('should reject keys generated with different secret', async () => {
      const authenticator1 = new EncryptedKeyAuthenticator(testSecret, () => fixedTimestamp, createFixedIV(0x12345678));
      const authenticator2 = new EncryptedKeyAuthenticator('different-secret', () => fixedTimestamp, createFixedIV(0x87654321));
      
      const key1 = await authenticator1.generateApiKey();
      const key2 = await authenticator2.generateApiKey();
      
      expect(await authenticator2.validateApiKey(key1)).toBe(false);
      expect(await authenticator1.validateApiKey(key2)).toBe(false);
      
      expect(key1).toMatchInlineSnapshot(`"tt-2EjRWeAAAAAAAAAAA4-uIdG2T_lHVU-q9PwOtA6GMuZMXuisp"`);
      expect(key2).toMatchInlineSnapshot(`"tt-2h2VDIQAAAAAAAAAA98x2ZM0Ru7ImPL8I1NluD_TpNXtuOYHb"`);
    });

    it('should reject malformed keys', async () => {
      const authenticator = new EncryptedKeyAuthenticator(testSecret, () => fixedTimestamp, createFixedIV(0x12345678));
      
      const testCases = [
        'invalid-key',
        'tt-2',
        'tt-2invalid-base64!@#',
        'tt-1validbutoldversion',
        ''
      ];

      const results = [];
      for (const key of testCases) {
        const isValid = await authenticator.validateApiKey(key);
        expect(isValid).toBe(false);
        results.push({ key, isValid });
      }
      
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "isValid": false,
            "key": "invalid-key",
          },
          {
            "isValid": false,
            "key": "tt-2",
          },
          {
            "isValid": false,
            "key": "tt-2invalid-base64!@#",
          },
          {
            "isValid": false,
            "key": "tt-1validbutoldversion",
          },
          {
            "isValid": false,
            "key": "",
          },
        ]
      `);
    });

    it('should reject tampered keys', async () => {
      const authenticator = new EncryptedKeyAuthenticator(testSecret, () => fixedTimestamp, createFixedIV(0x12345678));
      
      const key = await authenticator.generateApiKey();
      const midpoint = Math.floor(key.length / 2);
      const tamperedKey = key.slice(0, midpoint) + 
                         (key[midpoint] === 'a' ? 'b' : 'a') + 
                         key.slice(midpoint + 1);
      
      const isValid = await authenticator.validateApiKey(tamperedKey);
      expect(isValid).toBe(false);
      
      expect({ 
        original: key, 
        tampered: tamperedKey, 
        originalValid: await authenticator.validateApiKey(key),
        tamperedValid: isValid 
      }).toMatchInlineSnapshot(`
        {
          "original": "tt-2EjRWeAAAAAAAAAAA4-uIdG2T_lHVU-q9PwOtA6GMuZMXuisp",
          "originalValid": true,
          "tampered": "tt-2EjRWeAAAAAAAAAAA4-uIdGaT_lHVU-q9PwOtA6GMuZMXuisp",
          "tamperedValid": false,
        }
      `);
    });
  });

  describe('secret validation', () => {
    it('should reject empty secret', () => {
      expect(() => new EncryptedKeyAuthenticator('')).toThrow('Secret cannot be empty');
    });

    it('should generate keys with various secret lengths', async () => {
      const secrets = ['a', 'short', 'a-much-longer-secret-string'];
      const results = [];
      
      for (const secret of secrets) {
        const auth = new EncryptedKeyAuthenticator(secret, () => fixedTimestamp, createFixedIV(0xAABBCCDD));
        const key = await auth.generateApiKey();
        const isValid = await auth.validateApiKey(key);
        
        expect(isValid).toBe(true);
        results.push({ secret, key, isValid });
      }
      
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "isValid": true,
            "key": "tt-2qrvM3QAAAAAAAAAAFaN-3rw0Ens6DQEISAnKDR2XD4rpJiGe",
            "secret": "a",
          },
          {
            "isValid": true,
            "key": "tt-2qrvM3QAAAAAAAAAAgzZsZqyDJX_VJb99CFlmD22wHw3JBpI9",
            "secret": "short",
          },
          {
            "isValid": true,
            "key": "tt-2qrvM3QAAAAAAAAAAvRHCuzgjh1xqVeNmvohXINzbkNgNpllu",
            "secret": "a-much-longer-secret-string",
          },
        ]
      `);
    });
  });

  describe('key format consistency', () => {
    it('should generate URL-safe base64 keys', async () => {
      const keys = [];
      for (let i = 0; i < 3; i++) {
        const auth = new EncryptedKeyAuthenticator(testSecret, () => fixedTimestamp + i * 1000, createFixedIV(0x10000000 + i));
        const key = await auth.generateApiKey();
        expect(key).not.toMatch(/[+/=]/);
        keys.push(key);
      }
      expect(keys).toMatchInlineSnapshot(`
        [
          "tt-2EAAAAAAAAAAAAAAA5y0aHWNmfcpOLKu399_YJqUJqxLMFe69",
          "tt-2EAAAAQAAAAAAAAAAQv40IrTQacgRboZ5UNN2QngpL3azlTR3",
          "tt-2EAAAAgAAAAAAAAAAfQasYJTM6pOJNcllkJEaS-IhHoKwsinv",
        ]
      `);
    });

    it('should maintain format across different secrets', async () => {
      const results = [];
      const secrets = ['secret1', 'long-secret-string', '短'];

      for (const secret of secrets) {
        const auth = new EncryptedKeyAuthenticator(secret, () => fixedTimestamp, createFixedIV(0xDEADBEEF));
        const key = await auth.generateApiKey();
        expect(key).toMatch(/^tt-2[A-Za-z0-9_-]+$/);
        results.push({ secret, key });
      }
      
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "key": "tt-23q2-7wAAAAAAAAAAHnowQZo8IWZvRNaLWgzjE4d9G4zWEKss",
            "secret": "secret1",
          },
          {
            "key": "tt-23q2-7wAAAAAAAAAATk7hIzC7zHXoaeHA1f59byWJmWBS2_ss",
            "secret": "long-secret-string",
          },
          {
            "key": "tt-23q2-7wAAAAAAAAAAI6gPG0Soi5GYqBobNGlFW9BPtRtuTgS-",
            "secret": "短",
          },
        ]
      `);
    });
  });
});