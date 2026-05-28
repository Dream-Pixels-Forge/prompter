import type { ProviderRegistry } from './provider-registry';

export interface KeyStore {
  getApiKey(service: string): string | null;
}

export class ProviderEngine {
  constructor(
    private registry: ProviderRegistry,
    private keyStore: KeyStore,
  ) {}

  async generate(opts: {
    providerId: string;
    model: string;
    prompt: string;
    apiKey?: string;
    endpoint?: string;
    signal?: AbortSignal;
  }): Promise<string> {
    const def = this.registry.getDefinition(opts.providerId);
    if (!def) {
      throw new Error(`Unknown provider: '${opts.providerId}'`);
    }

    let apiKey = opts.apiKey;
    if (def.needsApiKey && !apiKey) {
      apiKey = this.keyStore.getApiKey(opts.providerId) ?? undefined;
    }
    if (def.needsApiKey && !apiKey) {
      throw new Error(`${def.name} API key not configured`);
    }

    const generate = this.registry.getGenerate(opts.providerId);
    if (!generate) {
      throw new Error(`No generate implementation for provider: '${opts.providerId}'`);
    }

    const endpoint = opts.endpoint ?? def.defaultEndpoint;

    return generate({
      model: opts.model,
      prompt: opts.prompt,
      apiKey,
      endpoint,
      signal: opts.signal,
    });
  }

  async check(opts: {
    providerId: string;
    endpoint?: string;
    apiKey?: string;
  }): Promise<{ available: boolean; message?: string }> {
    const check = this.registry.getCheck(opts.providerId);
    if (!check) {
      return { available: false, message: `No health check available for '${opts.providerId}'` };
    }

    const def = this.registry.getDefinition(opts.providerId);
    const endpoint = opts.endpoint ?? def?.defaultEndpoint;

    return check({ endpoint, apiKey: opts.apiKey });
  }
}
