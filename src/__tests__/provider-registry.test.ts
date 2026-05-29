import { ProviderRegistry } from '@/main/llm/provider-registry';
import type { ProviderDefinition, ProviderImplementation } from '@/shared/providers';
import { describe, expect, it } from 'vitest';

function makeDef(id: string, category: 'cloud' | 'local' = 'cloud'): ProviderDefinition {
  return {
    id,
    name: id,
    description: `${id} provider`,
    category,
    needsApiKey: id !== 'ollama',
    defaultModel: 'test-model',
    models: ['test-model'],
    needsEndpoint: false,
    website: `https://${id}.com`,
  };
}

function makeImpl(id: string): ProviderImplementation {
  return {
    providerId: id,
    async generate() {
      return 'output';
    },
  };
}

function makeImplWithCheck(id: string): ProviderImplementation {
  return {
    providerId: id,
    async generate() {
      return 'output';
    },
    async check() {
      return { available: true };
    },
  };
}

describe('ProviderRegistry', () => {
  it('register() stores definition and implementation', () => {
    const registry = new ProviderRegistry();
    const def = makeDef('openai');
    const impl = makeImpl('openai');

    registry.register(def, impl);

    expect(registry.has('openai')).toBe(true);
    expect(registry.getDefinition('openai')).toBe(def);
  });

  it('getDefinition() returns undefined for unknown id', () => {
    const registry = new ProviderRegistry();
    expect(registry.getDefinition('unknown')).toBeUndefined();
  });

  it('getGenerate() returns generate function', () => {
    const registry = new ProviderRegistry();
    registry.register(makeDef('openai'), makeImpl('openai'));

    const generate = registry.getGenerate('openai');
    expect(generate).toBeDefined();
    expect(typeof generate).toBe('function');
  });

  it('getGenerate() returns undefined for unknown id', () => {
    const registry = new ProviderRegistry();
    expect(registry.getGenerate('unknown')).toBeUndefined();
  });

  it('getCheck() returns check function when registered', () => {
    const registry = new ProviderRegistry();
    registry.register(makeDef('ollama'), makeImplWithCheck('ollama'));

    const check = registry.getCheck('ollama');
    expect(check).toBeDefined();
  });

  it('getCheck() returns undefined when not registered', () => {
    const registry = new ProviderRegistry();
    registry.register(makeDef('openai'), makeImpl('openai'));

    expect(registry.getCheck('openai')).toBeUndefined();
  });

  it('listDefinitions() returns all definitions', () => {
    const registry = new ProviderRegistry();
    registry.register(makeDef('openai'), makeImpl('openai'));
    registry.register(makeDef('anthropic'), makeImpl('anthropic'));

    const defs = registry.listDefinitions();
    expect(defs).toHaveLength(2);
    expect(defs.map((d) => d.id)).toContain('openai');
    expect(defs.map((d) => d.id)).toContain('anthropic');
  });

  it('listByCategory() filters by category', () => {
    const registry = new ProviderRegistry();
    registry.register(makeDef('openai', 'cloud'), makeImpl('openai'));
    registry.register(makeDef('ollama', 'local'), makeImpl('ollama'));

    const cloud = registry.listByCategory('cloud');
    expect(cloud).toHaveLength(1);
    expect(cloud[0].id).toBe('openai');

    const local = registry.listByCategory('local');
    expect(local).toHaveLength(1);
    expect(local[0].id).toBe('ollama');
  });

  it('has() returns true/false correctly', () => {
    const registry = new ProviderRegistry();
    registry.register(makeDef('openai'), makeImpl('openai'));

    expect(registry.has('openai')).toBe(true);
    expect(registry.has('anthropic')).toBe(false);
  });
});
