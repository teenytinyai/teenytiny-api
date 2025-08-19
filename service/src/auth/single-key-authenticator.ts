import type { Authenticator } from './authenticator.js';

/**
 * SingleKeyAuthenticator - A naive implementation using a single configured API key
 * 
 * This authenticator uses one API key for both generation and validation.
 * Suitable for development and simple demo environments.
 */
export class SingleKeyAuthenticator implements Authenticator {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateApiKey(): Promise<string> {
    return this.apiKey;
  }

  async validateApiKey(key: string): Promise<boolean> {
    return key === this.apiKey;
  }
}