# Phase 3: Provider UI Redesign

## Goal
Replace the hardcoded 3-provider settings UI with a dynamic, data-driven provider system. Add a searchable provider switcher (Cmd+P) and dynamic config cards.

## Design Principles
1. **No UI pollution** — Only the active provider's config is expanded. Others are collapsed.
2. **Searchable switching** — Cmd+P / Ctrl+P opens a categorized search palette.
3. **Configured badges** — Providers with saved API keys show a green indicator.
4. **Backward compatible** — Old AppSettings format auto-migrates on load.

## Files to Create (3 new)

### 1. `src/renderer/components/ProviderSwitcher.tsx`
Searchable, categorized provider selector. Keyboard shortcut: Cmd+P / Ctrl+P.

**Props:**
```typescript
interface ProviderSwitcherProps {
  open: boolean;
  onClose: () => void;
  onSelect: (providerId: string) => void;
  activeProvider: string;
  configuredProviders: Set<string>;
}
```

**UI layout:**
```
┌─────────────────────────────────────┐
│  🔍 Search providers...            │ ← auto-focus input
├─────────────────────────────────────┤
│  ☁  CLOUD                           │ ← section header (uppercase, small, muted)
│  ● OpenAI         gpt-4o           │ ← currently active (filled dot, accent color)
│  ○ Anthropic      claude-sonnet-4  │
│  ○ Groq           llama-3.3-70b   │
│  ○ DeepSeek       deepseek-chat   │
│  ✓ Gemini         (configured)     │ ← green checkmark = API key saved
│  ○ Mistral        mistral-large   │
│  ...                               │
│                                    │
│  🖥  LOCAL                          │
│  ○ Ollama         llama3.2        │
│                                    │
│  🔀  ROUTER                         │
│  ○ OpenRouter    openai/gpt-4o    │
└─────────────────────────────────────┘
```

**Behavior:**
- Pressing `Cmd+P` / `Ctrl+P` anywhere in the app opens this
- `Escape` or clicking outside closes
- Up/Down arrows navigate, Enter selects
- Typing filters the list (fuzzy match on name + description + model names)
- Active provider shows filled dot
- Configured providers show ✓ badge
- Recently used providers float to top section

### 2. `src/renderer/components/ProviderConfigCard.tsx`
Dynamic per-provider configuration panel. Renders completely from ProviderDefinition data.

**Props:**
```typescript
interface ProviderConfigCardProps {
  provider: ProviderDefinition;
  config: ProviderConfig; // current model + endpoint
  apiKey: string; // current api key (masked)
  isActive: boolean;
  onConfigChange: (config: Partial<ProviderConfig>) => void;
  onApiKeyChange: (key: string) => void;
  onSetActive: () => void;
}
```

**UI layout:**
```
┌─────────────────────────────────────┐
│ OpenAI                      ● Active│ ← provider name + active badge
│ Model:  [gpt-4o           ▼]       │ ← dropdown with provider.models[]
│ API Key:[·················]        │ ← password input
│         [Check] [Save]             │ ← check connectivity, save key
│ Endpoint: [https://api.open...]    │ ← only shown if provider.needsEndpoint
│         docs: openai.com           │ ← website link
└─────────────────────────────────────┘
```

**Collapsed state (when not active):**
```
┌─────────────────────────────────────┐
│ ○ Anthropic             ✓ Configured│
└─────────────────────────────────────┘
```

### 3. `src/renderer/components/ProviderSettings.tsx`
The full provider settings section. Replaces the old hardcoded sections in SettingsPanel.

**Composed of:**
- ProviderSwitcher (inline compact version at top)
- ProviderConfigCard for active provider
- Collapsed ProviderConfigCards for non-active providers

```
┌──────────────────────────────────────┐
│ Provider                             │
│ ┌──────────────────────────────────┐│
│ │ ● OpenAI   gpt-4o            ▼  ││ ← compact inline switcher
│ └──────────────────────────────────┘│
│                                      │
│ ┌──────────────────────────────────┐│
│ │ OpenAI                      ●   ││ ← ProviderConfigCard (expanded, active)
│ │ Model:  [gpt-4o           ▼]   ││
│ │ API Key:[·················]    ││
│ │         [Check] [Save]         ││
│ └──────────────────────────────────┘│
│                                      │
│ ┌──────────────────────────────────┐│
│ │ ✓ Anthropic   (configured)      ││ ← collapse card, green check
│ └──────────────────────────────────┘│
│ ┌──────────────────────────────────┐│
│ │ ○ Groq                          ││ ← collapsed, not configured
│ └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

## Files to Modify (5 existing)

### 4. `src/shared/types.ts` — Evolve AppSettings

**Current:**
```typescript
export type ProviderType = 'ollama' | 'openai' | 'anthropic';
export interface AppSettings {
  activeProvider: ProviderType;
  ollamaEndpoint: string;
  ollamaModel: string;
  openaiModel: string;
  openaiApiKey: string;
  anthropicModel: string;
  anthropicApiKey: string;
  hotkeyToggle: string;
  hotkeyMic: string;
}
```

**New:**
```typescript
import type { ProviderConfig } from './providers';

export type ProviderType = string; // open string — any registered provider ID

export interface AppSettings {
  /** Currently active provider ID */
  activeProvider: string;
  /** Per-provider runtime config, keyed by provider ID */
  providerConfigs: Record<string, ProviderConfig>;
  /** Recently used providers (list of IDs, newest first) */
  recentProviders: string[];
  /** Settings file format version for migrations */
  version: number;
  /** Hotkeys */
  hotkeyToggle: string;
  hotkeyMic: string;
}

export interface ProviderConfig {
  model: string;
  endpoint?: string;
}
```

Keep the `OPENAI_MODELS` and `ANTHROPIC_MODELS` constants for backward compat (other code may import them). Add deprecation comments.

**IMPORTANT**: Also export/import `ProviderConfig` from `./providers` to avoid circular deps. Actually, define `ProviderConfig` directly in types.ts to avoid importing from providers.ts. Keep types.ts self-contained for backward compat.

Actually, let's keep it cleaner: define `ProviderConfig` in providers.ts and import it in types.ts. That's fine since providers.ts only has types and doesn't import from types.ts.

Wait — types.ts currently exports `ProviderConfig` concept. Let me just update it. The actual `ProviderConfig` interface is defined in src/shared/providers.ts already.

Let me just add a re-export or update AppSettings to use it:

```typescript
// In types.ts, add:
export type ProviderType = string;

export interface AppSettings {
  activeProvider: string;
  providerConfigs: Record<string, import('./providers').ProviderConfig>;
  recentProviders: string[];
  version: number;
  hotkeyToggle: string;
  hotkeyMic: string;
}
```

### 5. `src/renderer/stores/settings-store.ts` — Dynamic provider state

Replace the flat-field approach with a dynamic map. The store loads:
1. AppSettings from disk (with migration from old format)
2. API keys for ALL registered providers from safeStorage
3. Provider definitions from shared/provider-definitions.ts

**Key changes:**
- Remove all flat fields (ollamaModel, openaiModel, openaiApiKey, etc.)
- Add `providerConfigs: Record<string, ProviderConfig>`
- Add `providerApiKeys: Record<string, string>` (in-memory only, not persisted)
- Add `configuredProviders: Set<string>`
- `loadSettings()` — loads settings, migrates old format, loads all API keys
- `saveSettings()` — saves providerConfigs, saves apiKey for active provider
- `getActiveLLMConfig()` — reads from providerConfigs[activeProvider]
- Add `checkProvider(providerId)` — calls window.api.provider.check

### 6. `src/main/llm/implementations/ollama.ts` — Minor update
`checkOllamaStatus` should return not just `OllamaStatus` but also handle the error case for the IPC bridge.

Actually, the ollama check is already working via the existing `checkOllamaStatus` export. But for other providers, we need a generic check mechanism.

### 7. `src/main/ipc.ts` — Add generic provider check handler

Add a new IPC channel `PROVIDER_CHECK: 'provider:check'` that calls the ProviderEngine's check mechanism.

Also update `settings:get` to return the new AppSettings format.

Add/changes:
```typescript
// New IPC channel
ipcMain.handle(IPC_CHANNELS.PROVIDER_CHECK, async (_event, providerId: string) => {
  const engine = getProviderEngine();
  return await engine.check(providerId);
});
```

### 8. `src/preload/index.ts` — Add provider:check bridge

```typescript
provider: {
  check: (providerId: string) => ipcRenderer.invoke(IPC_CHANNELS.PROVIDER_CHECK, providerId),
}
```

### 9. `src/shared/api-types.ts` — Add provider:check to PrompterApi

```typescript
provider: {
  check: (providerId: string) => Promise<{ available: boolean; message?: string }>;
}
```

### 10. `src/renderer/components/SettingsPanel.tsx` — Rewrite

Replace all hardcoded provider sections with a single `<ProviderSettings />` component.

Old: 265 lines with 3 hardcoded sections (Ollama, OpenAI, Anthropic)
New: ~60 lines that compose ProviderSwitcher + dynamic ProviderConfigCards

## Migration from Old AppSettings

In `settings-store.ts`, during `loadSettings()`:

```typescript
if (saved.version === undefined) {
  // Migrate from old flat format
  const migrated: Record<string, ProviderConfig> = {};
  if (saved.ollamaModel) migrated.ollama = { model: saved.ollamaModel, endpoint: saved.ollamaEndpoint };
  if (saved.openaiModel) migrated.openai = { model: saved.openaiModel };
  if (saved.anthropicModel) migrated.anthropic = { model: saved.anthropicModel };
  
  // Preserve old API keys (they'll also be in safeStorage)
  // ... migrate apiKeys
  
  saved.providerConfigs = migrated;
  saved.version = 1;
  // Save migrated format
}
```

## Implementation Order

1. Update `types.ts` — AppSettings evolution
2. Update `api-types.ts` — Add provider check
3. Update `preload/index.ts` — Add provider bridge
4. Add PROVIDER_CHECK to IPC_CHANNELS in types.ts
5. Update `ipc.ts` — Add provider:check handler, update settings:get
6. Create `ProviderSwitcher.tsx` — Searchable palette
7. Create `ProviderConfigCard.tsx` — Dynamic config
8. Create `ProviderSettings.tsx` — Composed provider section
9. Update `settings-store.ts` — Dynamic state + migration
10. Rewrite `SettingsPanel.tsx` — Use dynamic components
11. Verify: typecheck, lint, tests, build

## Verification
```bash
pnpm typecheck    # 0 errors
pnpm lint         # 0 errors, 0 warnings
pnpm test         # 25/25 tests
pnpm build        # clean dist
```
