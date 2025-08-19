import type { Authenticator } from './authenticator.js';

/**
 * EncryptedKeyAuthenticator - Optimized implementation using AES-GCM and Web Crypto API
 * 
 * Key format: "tt-2" + base64url(iv + encrypted_data_with_auth_tag)
 * - Uses AES-256-GCM for authenticated encryption (replaces CBC+HMAC)
 * - Binary payload for compact encoding
 * - Web Crypto API for Cloudflare Worker compatibility
 * - ~52 characters total (53% smaller than previous version)
 */
export class EncryptedKeyAuthenticator implements Authenticator {
  private static readonly KEY_PREFIX = 'tt-';
  private static readonly FORMAT_VERSION = '2';
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly IV_LENGTH = 12; // 96 bits for GCM mode (recommended)
  private static readonly PBKDF2_ITERATIONS = 100000; // OWASP recommended minimum
  private static readonly PBKDF2_SALT = 'teenytiny-api-key-salt'; // Fixed salt for deterministic keys

  private secretString: string;
  private timestampFn: () => number;
  private ivGeneratorFn: (() => Uint8Array) | undefined;
  private crypto: Crypto;

  /**
   * @param secretString Secret for key encryption/decryption
   * @param timestampFn Optional timestamp function (defaults to Date.now, useful for deterministic testing)
   * @param ivGeneratorFn Optional IV generator function (defaults to crypto.getRandomValues, useful for deterministic testing)
   */
  constructor(secretString: string, timestampFn?: () => number, ivGeneratorFn?: (() => Uint8Array) | undefined) {
    this.validateSecret(secretString);
    this.secretString = secretString;
    this.timestampFn = timestampFn ?? Date.now;
    this.ivGeneratorFn = ivGeneratorFn;
    
    // Use globalThis.crypto for universal compatibility (Node.js 16+ and Cloudflare Workers)
    this.crypto = globalThis.crypto;
    if (!this.crypto?.subtle) {
      throw new Error('Web Crypto API not available. Node.js 16+ or modern browser required.');
    }
  }

  /**
   * Validates the secret string
   */
  private validateSecret(secretString: string): void {
    if (typeof secretString !== 'string') {
      throw new Error('Secret must be a string');
    }
    
    if (secretString.length === 0) {
      throw new Error('Secret cannot be empty (check configuration)');
    }
  }

  /**
   * Derives AES-256 key from secret string using PBKDF2
   */
  private async deriveKeyFromSecret(secretString: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    
    // Import the secret string as key material
    const keyMaterial = await this.crypto.subtle.importKey(
      'raw',
      encoder.encode(secretString),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive AES-256 key using PBKDF2
    return await this.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(EncryptedKeyAuthenticator.PBKDF2_SALT),
        iterations: EncryptedKeyAuthenticator.PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: EncryptedKeyAuthenticator.ALGORITHM, length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Creates binary payload from key data
   */
  private createBinaryPayload(data: { created: number; v: number }): Uint8Array {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    
    // Store timestamp as seconds (4 bytes) + version (1 byte) + reserved (3 bytes)
    view.setUint32(0, Math.floor(data.created / 1000), false); // big-endian timestamp in seconds
    view.setUint8(4, data.v); // version
    // bytes 5-7 are reserved (remain 0)
    
    return new Uint8Array(buffer);
  }

  /**
   * Parses binary payload back to key data
   */
  private parseBinaryPayload(payload: Uint8Array): { created: number; v: number } {
    if (payload.length < 8) {
      throw new Error('Invalid payload: too short');
    }
    
    const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
    
    const timestampSeconds = view.getUint32(0, false); // big-endian
    const version = view.getUint8(4);
    
    return {
      created: timestampSeconds * 1000, // convert back to milliseconds
      v: version
    };
  }

  /**
   * Encrypts data to API key format using AES-GCM
   */
  private async encryptToKeyFormat(data: { created: number; v: number }): Promise<string> {
    const key = await this.deriveKeyFromSecret(this.secretString);
    
    // Create binary payload
    const plaintext = this.createBinaryPayload(data);
    
    // Generate IV (random or deterministic for testing)
    const iv = this.ivGeneratorFn 
      ? this.ivGeneratorFn() 
      : this.crypto.getRandomValues(new Uint8Array(EncryptedKeyAuthenticator.IV_LENGTH));

    // Encrypt with AES-256-GCM (includes authentication)
    const encrypted = await this.crypto.subtle.encrypt(
      {
        name: EncryptedKeyAuthenticator.ALGORITHM,
        iv: iv as BufferSource
      },
      key,
      plaintext as BufferSource
    );

    // Combine IV + encrypted data (which includes auth tag)
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to URL-safe base64
    const base64url = this.arrayBufferToBase64Url(combined);

    return EncryptedKeyAuthenticator.KEY_PREFIX + EncryptedKeyAuthenticator.FORMAT_VERSION + base64url;
  }

  /**
   * Decrypts API key back to data format
   */
  private async decryptFromKeyFormat(apiKey: string): Promise<{ created: number; v: number }> {
    const key = await this.deriveKeyFromSecret(this.secretString);

    // Validate format
    if (!apiKey.startsWith(EncryptedKeyAuthenticator.KEY_PREFIX + EncryptedKeyAuthenticator.FORMAT_VERSION)) {
      throw new Error('Invalid API key format');
    }

    // Extract base64url part
    const base64url = apiKey.slice(EncryptedKeyAuthenticator.KEY_PREFIX.length + EncryptedKeyAuthenticator.FORMAT_VERSION.length);

    // Convert from URL-safe base64
    let combined: Uint8Array;
    try {
      combined = this.base64UrlToArrayBuffer(base64url);
    } catch (error) {
      throw new Error('Invalid API key encoding');
    }

    // Extract IV and encrypted data
    if (combined.length < EncryptedKeyAuthenticator.IV_LENGTH) {
      throw new Error('Invalid API key: too short');
    }

    const iv = combined.slice(0, EncryptedKeyAuthenticator.IV_LENGTH);
    const encrypted = combined.slice(EncryptedKeyAuthenticator.IV_LENGTH);

    // Decrypt with AES-256-GCM
    try {
      const decrypted = await this.crypto.subtle.decrypt(
        {
          name: EncryptedKeyAuthenticator.ALGORITHM,
          iv: iv as BufferSource
        },
        key,
        encrypted
      );
      
      // Parse binary payload back to data
      return this.parseBinaryPayload(new Uint8Array(decrypted));
    } catch (error) {
      throw new Error('Invalid API key: decryption failed');
    }
  }

  /**
   * Converts ArrayBuffer to URL-safe base64
   */
  private arrayBufferToBase64Url(buffer: Uint8Array): string {
    const binaryString = String.fromCharCode(...buffer);
    const base64 = btoa(binaryString);
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Converts URL-safe base64 to ArrayBuffer
   */
  private base64UrlToArrayBuffer(base64url: string): Uint8Array {
    // Convert from URL-safe base64 to standard base64 and add padding
    const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + padding;
    
    const binaryString = atob(base64);
    return new Uint8Array([...binaryString].map(c => c.charCodeAt(0)));
  }

  async generateApiKey(): Promise<string> {
    const keyData = {
      created: this.timestampFn(),
      v: 1
    };

    return this.encryptToKeyFormat(keyData);
  }

  async validateApiKey(key: string): Promise<boolean> {
    try {
      const data = await this.decryptFromKeyFormat(key);
      // Key is valid if we can decrypt it successfully
      // Could add additional validation here (expiration, etc.)
      return data.created !== undefined && data.v !== undefined;
    } catch {
      return false;
    }
  }
}