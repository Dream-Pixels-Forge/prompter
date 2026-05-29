export type ProviderCategory = 'cloud' | 'local' | 'router';

export interface ProviderConfig {
  model: string;
  endpoint?: string;
}

export interface ProviderDefinition {
  id: string;
  name: string;
  description: string;
  category: ProviderCategory;
  models: string[];
  defaultModel: string;
  defaultEndpoint?: string;
  needsEndpoint: boolean;
  website: string;
  needsApiKey: boolean;
  color?: string;
}

export interface ProviderImplementation {
  providerId: string;
  generate: (opts: {
    model: string;
    prompt: string;
    apiKey?: string;
    endpoint?: string;
    signal?: AbortSignal;
  }) => Promise<string>;
  check?: (opts: { endpoint?: string; apiKey?: string }) => Promise<{ available: boolean; message?: string }>;
}
