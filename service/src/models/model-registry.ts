import { Model } from './model.js';

// Protocol-agnostic model registry
export class ModelRegistry {
  private models = new Map<string, Model>();
  private metadata = new Map<string, { created: number }>();

  constructor(private ownedBy: string = 'teenytiny-ai') {}

  register(id: string, model: Model): void {
    this.models.set(id, model);
    this.metadata.set(id, {
      created: Math.floor(Date.now() / 1000),
    });
  }

  get(id: string): Model | undefined {
    return this.models.get(id);
  }

  has(id: string): boolean {
    return this.models.has(id);
  }

  getIds(): string[] {
    return Array.from(this.models.keys());
  }

  getMetadata(id: string): { created: number; ownedBy: string } | undefined {
    const meta = this.metadata.get(id);
    if (!meta) return undefined;
    
    return {
      created: meta.created,
      ownedBy: this.ownedBy,
    };
  }
}