import type { Model as OpenAIModel, ModelsResponse } from './types.js';
import { ModelRegistry } from '../models/model-registry.js';
import { Model } from '../models/model.js';
import { OpenAIAdapter } from './adapter.js';

// OpenAI-specific model registry that wraps the core registry
export class OpenAIModelRegistry {
  private adapters = new Map<string, OpenAIAdapter>();

  constructor(private coreRegistry: ModelRegistry) {}

  register(id: string, model: Model): void {
    // Register in core registry
    this.coreRegistry.register(id, model);
    
    // Create OpenAI adapter
    const adapter = new OpenAIAdapter(model, id);
    this.adapters.set(id, adapter);
  }

  get(id: string): OpenAIAdapter | undefined {
    return this.adapters.get(id);
  }

  has(id: string): boolean {
    return this.coreRegistry.has(id);
  }

  list(): OpenAIModel[] {
    return this.coreRegistry.getIds().map(id => {
      const meta = this.coreRegistry.getMetadata(id)!;
      return {
        id,
        object: 'model' as const,
        created: meta.created,
        owned_by: meta.ownedBy,
      };
    });
  }

  listAsResponse(): ModelsResponse {
    return {
      object: 'list',
      data: this.list(),
    };
  }
}