import { ProviderEngine } from '@/main/llm/provider-engine';
import { ProviderRegistry } from '@/main/llm/provider-registry';
import type { ProviderDefinition, ProviderImplementation } from '@/shared/providers';
import { describe, expect, it, vi } from 'vitest';

function makeDef(id: string, needsApiKey = true): ProviderDefinition {
  return {
    id,
    name: id,
    description: `${id} provider`,
    category: 'cloud',
    needsApiKey,
    defaultModel: 'test-model',
    models: ['test-model'],
    needsEndpoint: false,
    website: `https://${id}.com`,
  };
}

function makeImpl(id: string): ProviderImplementation {
  return {
    providerId: id,
    async generate({ prompt }) {
      return `response to: ${prompt}`;
    },
  };
}

function makeImplWithCheck(id: string, available = true): ProviderImplementation {
  return {
    providerId: id,
    async generate({ prompt }) {
      return `response to: ${prompt}`;
    },
    async check() {
      return { available };
    },
  };
}

describe('ProviderEngine', () => {
  it('generate() calls the correct provider', async () => {
    const registry = new ProviderRegistry();
    registry.register(makeDef('openai'), makeImpl('openai'));

    const keyStore = { getApiKey: () => 'test-key' };
    const engine = new ProviderEngine(registry, keyStore);

    const result = await engine.generate({
      providerId: 'openai',
      model: 'test-model',
      prompt: 'hello',
      apiKey: 'test-key',
    });

    expect(result).toBe('response to: hello');
  });

  it('generate() throws if API key is missing for provider that needs one', async () => {
    const registry = new ProviderRegistry();
    registry.register(makeDef('openai', true), makeImpl('openai'));

    const keyStore = { getApiKey: () => null };
    const engine = new ProviderEngine(registry, keyStore);

    await expect(
      engine.generate({
        providerId: 'openai',
        model: 'test-model',
        prompt: 'hello',
      }),
    ).rejects.toThrow('API key not configured');
  });

  it('generate() does not require API key for providers that dont need one', async () => {
    const registry = new ProviderRegistry();
    registry.register(makeDef('ollama', false), makeImpl('ollama'));

    const keyStore = { getApiKey: () => null };
    const engine = new ProviderEngine(registry, keyStore);

    const result = await engine.generate({
      providerId: 'ollama',
      model: 'test-model',
      prompt: 'hello',
    });

    expect(result).toBe('response to: hello');
  });

  it('generate() throws for unknown provider', async () => {
    const registry = new ProviderRegistry();
    const keyStore = { getApiKey: () => null };
    const engine = new ProviderEngine(registry, keyStore);

    await expect(
      engine.generate({
        providerId: 'unknown',
        model: 'test-model',
        prompt: 'hello',
      }),
    ).rejects.toThrow('Unknown provider');
  });

  it('check() returns { available: false } if no check implementation', async () => {
    const registry = new ProviderRegistry();
    registry.register(makeDef('openai'), makeImpl('openai'));

    const keyStore = { getApiKey: () => null };
    const engine = new ProviderEngine(registry, keyStore);

    const result = await engine.check({ providerId: 'openai' });
    expect(result).toEqual({ available: false, message: expect.stringContaining('No health check') });
  });

  it('check() calls the check implementation if registered', async () => {
    const registry = new ProviderRegistry();
    registry.register(makeDef('ollama', false), makeImplWithCheck('ollama', true));

    const keyStore = { getApiKey: () => null };
    const engine = new ProviderEngine(registry, keyStore);

    const result = await engine.check({ providerId: 'ollama' });
    expect(result).toEqual({ available: true });
  });
});
