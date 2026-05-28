# Phase 3: settings-store.ts — Dynamic Provider State Refactor

## Issue: ISS-0005

## Current State (BAD)
Settings store has flat, hardcoded fields for exactly 3 providers:
```typescript
interface SettingsStore extends AppSettings {
  ollamaEndpoint: string;
  ollamaModel: string;
  openaiModel: string;
  openaiApiKey: string;
  anthropicModel: string;
  anthropicApiKey: string;
  // ... plus helper fields
}
```

AppSettings (types.ts) has ALREADY been evolved to dynamic format:
```typescript
export interface AppSettings {
  activeProvider: string;
  providerConfigs: Record<string, { model: string; endpoint?: string }>;
  recentProviders: string[];
  version: number;
  hotkeyToggle: string;
  hotkeyMic: string;
}
```

## What to Do

### 1. Replace ALL flat fields with:
```typescript
interface SettingsStore {
  loaded: boolean;
  activeProvider: string;
  providerConfigs: Record<string, { model: string; endpoint?: string }>;
  providerApiKeys: Record<string, string>;
  recentProviders: string[];
  version: number;
  hotkeyToggle: string;
  hotkeyMic: string;
  ollamaAvailable: boolean;
  ollamaModels: string[];
  
  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  saveSettings: () => Promise<void>;
  checkOllamaStatus: () => Promise<void>;
  saveProviderKey: (providerId: string, key: string) => Promise<void>;
  getActiveLLMConfig: () => { provider: string; model: string; baseUrl?: string; apiKey?: string };
}
```

### 2. Migration in loadSettings():
```typescript
loadSettings: async () => {
  const saved = await window.api.settings.get();
  
  // Handle migration from old flat format (version === undefined)
  if (saved.version === undefined) {
    const migrated: Record<string, { model: string; endpoint?: string }> = {};
    if (saved.ollamaModel) migrated.ollama = { model: saved.ollamaModel, endpoint: saved.ollamaEndpoint };
    if (saved.openaiModel) migrated.openai = { model: saved.openaiModel };
    if (saved.anthropicModel) migrated.anthropic = { model: saved.anthropicModel };
    saved.providerConfigs = migrated;
    saved.version = 1;
    saved.recentProviders = ['openai', 'ollama', 'anthropic'].filter(id => migrated[id]);
  }
  
  // Load API keys for ALL registered providers from encrypted storage
  const providerIds = ['ollama', 'openai', 'anthropic', 'groq', 'deepseek', 'together', 'fireworks', 'perplexity', 'xai', 'mistral', 'gemini', 'cohere', 'openrouter'];
  const keyEntries = await Promise.all(
    providerIds.map(async (id) => [id, await getApiKey(id)] as [string, string | null])
  );
  const providerApiKeys: Record<string, string> = {};
  for (const [id, key] of keyEntries) {
    if (key) providerApiKeys[id] = key;
  }
  
  set({
    activeProvider: saved.activeProvider || 'ollama',
    providerConfigs: saved.providerConfigs || {},
    providerApiKeys,
    recentProviders: saved.recentProviders || [],
    version: saved.version || 1,
    hotkeyToggle: saved.hotkeyToggle || 'Alt+Space',
    hotkeyMic: saved.hotkeyMic || 'Alt+M',
    loaded: true,
  });
}
```

### 3. saveSettings() — Dynamic:
Save providerConfigs to disk, and save each API key via safeStorage. Iterate over providerApiKeys entries.

### 4. getActiveLLMConfig() — Dynamic:
```typescript
getActiveLLMConfig: () => {
  const state = get();
  const config = state.providerConfigs[state.activeProvider];
  return {
    provider: state.activeProvider,
    model: config?.model || '',
    baseUrl: config?.endpoint,
    apiKey: state.providerApiKeys[state.activeProvider],
  };
}
```

### 5. Add saveProviderKey(providerId, key):
Saves a provider's API key to both in-memory map and safeStorage.

### 6. Remove these deprecated fields:
- `ollamaEndpoint`, `ollamaModel`, `openaiModel`, `openaiApiKey`, `anthropicModel`, `anthropicApiKey`

### 7. Keep:
- `checkOllamaStatus()` — still works, calls window.api.ollama.check()
- `updateSetting` — works with new key names
- `ollamaAvailable`, `ollamaModels` — still needed for dynamic model list

## Dependencies
- `@/shared/types` — AppSettings already has new shape
- `@/renderer/lib/llm` — getApiKey, saveApiKey
- `zustand` — state management

## Verification
```bash
pnpm typecheck    # 0 errors
pnpm lint         # 0 errors
pnpm test run     # 25/25 tests
```

## Key Files
- `src/renderer/stores/settings-store.ts` — THIS FILE (to modify)
- `src/shared/types.ts` — AppSettings interface (already updated, DON'T touch)
