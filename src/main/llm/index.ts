import { PROVIDER_DEFINITIONS } from '@/shared/provider-definitions';
import { anthropicImpl } from './implementations/anthropic';
import { cohereImpl } from './implementations/cohere';
import { deepseekImpl } from './implementations/deepseek';
import { fireworksImpl } from './implementations/fireworks';
import { geminiImpl } from './implementations/gemini';
import { groqImpl } from './implementations/groq';
import { mistralImpl } from './implementations/mistral';
import { ollamaImpl } from './implementations/ollama';
import { openaiImpl } from './implementations/openai';
import { openrouterImpl } from './implementations/openrouter';
import { perplexityImpl } from './implementations/perplexity';
import { togetherImpl } from './implementations/together';
import { xaiImpl } from './implementations/xai';
import type { KeyStore } from './provider-engine';
import { ProviderEngine } from './provider-engine';
import { ProviderRegistry } from './provider-registry';

const IMPLEMENTATIONS = [
  openaiImpl,
  anthropicImpl,
  ollamaImpl,
  groqImpl,
  deepseekImpl,
  togetherImpl,
  fireworksImpl,
  perplexityImpl,
  xaiImpl,
  mistralImpl,
  geminiImpl,
  cohereImpl,
  openrouterImpl,
];

export function createProviderRegistry(): ProviderRegistry {
  const registry = new ProviderRegistry();

  for (const impl of IMPLEMENTATIONS) {
    const def = PROVIDER_DEFINITIONS.find((d) => d.id === impl.providerId);
    if (!def) {
      console.warn(`[provider] No definition found for implementation: ${impl.providerId}, skipping`);
      continue;
    }
    registry.register(def, impl);
  }

  return registry;
}

export function createProviderEngine(keyStore: KeyStore): ProviderEngine {
  const registry = createProviderRegistry();
  return new ProviderEngine(registry, keyStore);
}

// Singleton engine instance for reuse across IPC handlers
let _engine: ProviderEngine | null = null;

export function getEngine(): ProviderEngine {
  if (!_engine) {
    throw new Error('ProviderEngine not initialized. Call initEngine() first.');
  }
  return _engine;
}

export function initEngine(keyStore: KeyStore): ProviderEngine {
  _engine = createProviderEngine(keyStore);
  return _engine;
}
