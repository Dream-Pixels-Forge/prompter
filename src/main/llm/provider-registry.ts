import type { ProviderCategory, ProviderDefinition, ProviderImplementation } from '@/shared/providers';

export class ProviderRegistry {
  private definitions = new Map<string, ProviderDefinition>();
  private implementations = new Map<string, ProviderImplementation>();

  register(definition: ProviderDefinition, impl: ProviderImplementation): void {
    this.definitions.set(definition.id, definition);
    this.implementations.set(impl.providerId, impl);
  }

  getDefinition(id: string): ProviderDefinition | undefined {
    return this.definitions.get(id);
  }

  getGenerate(id: string): ProviderImplementation['generate'] | undefined {
    return this.implementations.get(id)?.generate;
  }

  getCheck(id: string): ProviderImplementation['check'] | undefined {
    return this.implementations.get(id)?.check;
  }

  listDefinitions(): ProviderDefinition[] {
    return Array.from(this.definitions.values());
  }

  listByCategory(category: ProviderCategory): ProviderDefinition[] {
    return this.listDefinitions().filter((d) => d.category === category);
  }

  has(id: string): boolean {
    return this.definitions.has(id);
  }
}
