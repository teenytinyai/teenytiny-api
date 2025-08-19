/**
 * Authenticator interface defines the contract for API key management
 * 
 * Implementations can provide different key storage backends:
 * - Single key (development/demo)
 * - Database storage
 * - Remote key management service
 * - Key rotation with expiration
 */
export interface Authenticator {
  /**
   * Generates a new API key
   * 
   * @returns Promise<string> A new API key
   */
  generateApiKey(): Promise<string>;

  /**
   * Validates an API key
   * 
   * @param key The API key to validate
   * @returns Promise<boolean> True if key is valid, false otherwise
   */
  validateApiKey(key: string): Promise<boolean>;
}