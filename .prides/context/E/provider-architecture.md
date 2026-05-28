# Extend Phase: Provider Architecture Redesign

## Current State
Prompter has 3 LLM providers with inconsistent patterns:
- **Ollama**: endpoint + model (local, free)
- **OpenAI**: apiKey + model (cloud, paid)
- **Anthropic**: apiKey + model (cloud, paid)

Each is implemented separately in `src/main/llm/{provider}.ts` with different function signatures.

The orchestrator at `src/main/llm/orchestrator.ts` has hardcoded defaults per provider:
```ts
const DEFAULTS = {
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
  openaiModel: 'gpt-4o',
  anthropicModel: 'claude-sonnet-4-20250514',
};
```

Provider switching is primitive — via a `ProviderType` enum in Settings.

## User's Requirement
"Add all, because all providers follow the same pattern (models, api key). We don't need pollution in our UI but a better way to switch."

This means:
1. **Add ALL major LLM providers** — every provider has the same shape: models + API key
2. **No UI pollution** — don't add 20 dropdowns/fields to the settings panel
3. **A clean way to switch** — smarter than a flat list of 15 providers

## Providers to Add
Currently: Ollama, OpenAI, Anthropic
To add (all follow models + API key pattern):
- **Groq** — fast inference, free tier
- **Google Gemini** — API key + models
- **DeepSeek** — API key + models 
- **Mistral AI** — API key + models
- **Perplexity** — API key + models
- **Together AI** — API key + models
- **OpenRouter** — unified API, one key for many models
- **Fireworks AI** — API key + models
- **xAI/Grok** — API key + models
- **Cohere** — API key + models
- **AWS Bedrock** — more complex (credentials), skip or optional
- **Azure OpenAI** — endpoint + key + model

## Design Constraints
1. All providers share the same interface: `{ apiKey: string, model: string, endpoint?: string }`
2. The settings UI must NOT have 15 separate provider config sections
3. Provider switching should feel natural — minimal friction
4. API keys should remain in Electron safeStorage (current pattern works)
5. Framework detection (openai/karpathy/mplct/etc.) should still work
6. CSP allows `connect-src 'self' http://localhost:11434` — will need to relax for cloud providers

## Design Directions to Consider
- **Unified API key store**: One place for all keys, managed through the same pattern
- **Provider categories**: Cloud (paid), Local (free), OpenRouter (unified)
- **Smart provider switching**: Auto-select based on what's configured and available
- **Searchable provider selector**: Type to find, not scroll through 15 items

## Key Files
- `src/shared/types.ts` — ProviderType, GenerateRequest/Response, AppSettings
- `src/shared/api-types.ts` — PrompterApi interface
- `src/main/llm/orchestrator.ts` — Routes generation to correct provider
- `src/main/llm/openai.ts` — OpenAI implementation template
- `src/main/llm/anthropic.ts` — Anthropic implementation template  
- `src/main/llm/ollama.ts` — Ollama implementation template
- `src/renderer/components/SettingsPanel.tsx` — Current provider settings UI
- `src/renderer/stores/app-store.ts` — App state
- `src/shared/frameworks.ts` — Framework detection system

## Output
Design a provider architecture that:
1. Normalizes all providers to the same interface
2. Minimizes boilerplate for adding new providers
3. Provides a clean switching mechanism (not UI pollution)
4. Can be implemented incrementally (add providers one at a time)
