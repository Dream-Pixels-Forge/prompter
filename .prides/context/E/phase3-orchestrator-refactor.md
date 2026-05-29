# Phase 3: orchestrator.ts — Dynamic Provider Config Resolution

## Issue: ISS-0006

## Current State (BAD)
Orchestrator has flat, hardcoded activeConfig with 3 providers:
```typescript
let activeConfig = {
  activeProvider: 'ollama' as ProviderType,
  ollamaEndpoint: DEFAULTS.ollamaEndpoint,
  ollamaModel: DEFAULTS.ollamaModel,
  openaiModel: DEFAULTS.openaiModel,
  openaiApiKey: '',
  anthropicModel: DEFAULTS.anthropicModel,
  anthropicApiKey: '',
};
```

And resolveProviderConfig uses a switch statement:
```typescript
function resolveProviderConfig(provider: ProviderType) {
  switch (provider) {
    case 'ollama': return { model: activeConfig.ollamaModel, endpoint: activeConfig.ollamaEndpoint, apiKey: undefined };
    case 'openai': return { model: activeConfig.openaiModel, endpoint: undefined, apiKey: activeConfig.openaiApiKey };
    case 'anthropic': return { model: activeConfig.anthropicModel, endpoint: undefined, apiKey: activeConfig.anthropicApiKey };
    default: throw new Error(`Unknown provider: ${provider}`);
  }
}
```

## What to Do

### 1. Replace activeConfig with a dynamic map:
```typescript
interface ProviderRuntimeConfig {
  model: string;
  endpoint?: string;
}

interface RuntimeConfig {
  activeProvider: string;
  providerConfigs: Record<string, ProviderRuntimeConfig>;
  providerApiKeys: Record<string, string>;
}

let activeConfig: RuntimeConfig = {
  activeProvider: 'ollama',
  providerConfigs: {
    ollama: { model: 'llama3.2', endpoint: 'http://localhost:11434' },
    openai: { model: 'gpt-4o' },
    anthropic: { model: 'claude-sonnet-4-20250514' },
  },
  providerApiKeys: {},
};
```

### 2. updateConfig — Accept new AppSettings format:
```typescript
export function updateConfig(config: Partial<AppSettings>) {
  if (config.activeProvider !== undefined) activeConfig.activeProvider = config.activeProvider;
  if (config.providerConfigs !== undefined) {
    for (const [id, cfg] of Object.entries(config.providerConfigs)) {
      activeConfig.providerConfigs[id] = { ...activeConfig.providerConfigs[id], ...cfg };
    }
  }
  if (config.hotkeyToggle !== undefined) { /* ignore, not used by orchestrator */ }
  // Also accept old flat fields for backward compatibility during migration
  // ... keep old flat field handling for now, but we'll remove it after migration
}
```

Actually, for a smoother transition, updateConfig should handle BOTH old and new formats:
```typescript
export function updateConfig(config: Partial<AppSettings> | Partial<typeof activeConfig_OLD>) {
  // New format (versioned)
  if ('providerConfigs' in config && config.providerConfigs) {
    for (const [id, cfg] of Object.entries(config.providerConfigs)) {
      activeConfig.providerConfigs[id] = { ...activeConfig.providerConfigs[id], ...cfg };
    }
  }
  // Old format (flat fields) — migrate to new format
  if ('ollamaModel' in config) { /* ... migrate ... */ }
  if (config.activeProvider) activeConfig.activeProvider = config.activeProvider;
}
```

### 3. resolveProviderConfig — Dynamic:
```typescript
function resolveProviderConfig(provider: string) {
  const cfg = activeConfig.providerConfigs[provider];
  if (!cfg) throw new Error(`Unknown provider: ${provider}`);
  return {
    model: cfg.model,
    endpoint: cfg.endpoint,
    apiKey: activeConfig.providerApiKeys[provider],
  };
}
```

### 4. getEngine() KeyStore — Generic:
Update the KeyStore to work with ANY provider ID, not just openai/anthropic:
```typescript
function getEngine(): ProviderEngine {
  if (!engine) {
    engine = createProviderEngine({
      getApiKey: (service: string) => activeConfig.providerApiKeys[service] || null,
    });
  }
  return engine;
}
```

### 5. Remove DEFAULTS constant:
Replace with initial values derived from PROVIDER_DEFINITIONS (import from @/shared/provider-definitions).

### 6. Keep EVERYTHING else unchanged:
- generatePrompt()
- callLLM()
- parseLLMOutput()
- buildSectionContent()
- extractDomain(), extractGoal(), extractAudienceTone()
- All function signatures

## Dependencies
- `@/shared/types` — AppSettings, ProviderType
- `@/shared/provider-definitions` — PROVIDER_DEFINITIONS (for defaults)
- `./index` — createProviderEngine

## Verification
```bash
pnpm typecheck    # 0 errors
pnpm lint         # 0 errors
pnpm test run     # 25/25 tests
pnpm build        # clean dist
```

## Key Files
- `src/main/llm/orchestrator.ts` — THIS FILE (to modify)
- `src/shared/types.ts` — AppSettings interface (already updated)
- `src/shared/provider-definitions.ts` — Provider registry (for defaults)
