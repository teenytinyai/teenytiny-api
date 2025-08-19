import type { Authenticator } from './authenticator.js';

/**
 * FallbackKeyAuthenticator - Composite authenticator supporting multiple key formats
 * 
 * Implements the Composite design pattern to enable graceful migration between
 * different key formats while maintaining backward compatibility.
 * 
 * Key generation: Always uses the primary (first) authenticator
 * Key validation: Tries primary first, then falls back through the list until one succeeds
 * 
 * Use case: Allows for graceful migration to new key formats
 */
export class FallbackKeyAuthenticator implements Authenticator {
  private authenticators: Authenticator[];

  /**
   * @param authenticators Array of authenticators in priority order
   *                      [0] = primary (used for generation)
   *                      [1+] = fallbacks (used for validation only)
   */
  constructor(authenticators: Authenticator[]) {
    if (!authenticators || authenticators.length === 0) {
      throw new Error('At least one authenticator is required');
    }
    
    this.authenticators = [...authenticators];
  }

  /**
   * Generates API key using the primary (first) authenticator
   */
  async generateApiKey(): Promise<string> {
    return this.authenticators[0]!.generateApiKey();
  }

  /**
   * Validates API key by trying each authenticator in sequence
   * Returns true if any authenticator validates the key
   */
  async validateApiKey(key: string): Promise<boolean> {
    // Try each authenticator in order until one succeeds
    for (const authenticator of this.authenticators) {
      try {
        const isValid = await authenticator.validateApiKey(key);
        if (isValid) {
          return true;
        }
      } catch (error) {
        // If an authenticator throws an error, continue to the next one
        // This handles cases where key format is completely wrong for that authenticator
        continue;
      }
    }
    
    // No authenticator could validate the key
    return false;
  }

}