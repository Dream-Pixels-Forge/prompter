# Provider Architecture Design — Prompter

## 1. Architecture Overview

### Current State (Problems)

```
AppSettings (flat)           orchestrator.ts (switch)       3 provider files
┌─────────────────┐          ┌───────────────────┐         ┌─────────────┐
│ activeProvider   │          │ switch(provider)  │         │ openai.ts   │
│ ollamaEndpoint   │          │   case 'ollama':  │───▶     │ anthropic.ts│
│ ollamaModel      │          │   case 'openai':  │───▶     │ ollama.ts   │
│ openaiModel      │          │   case 'anthropic':│───▶    └─────────────┘
│ openaiApiKey     │          └───────────────────┘
│ anthropicModel   │
│ anthropicApiKey  │          SettingsPanel.tsx (hardcoded)
│ ...              │          ┌───────────────────────────────┐
└─────────────────┘          │ Provider selector (3 items)  │
                              │ Ollama section               │
                              │ OpenAI section               │
                              │ Anthropic section            │
                              └───────────────────────────────┘
```

**This doesn't scale to 15+ providers.** Every new provider requires:
- New fields in `AppSettings`
- New case in the orchestrator switch
- New UI section in `SettingsPanel.tsx`
- A new `src/main/llm/{name}.ts` file with its own function signature

### Target State

```
Provider Registry (data)         Provider Runtime               Provider Implementations
┌─────────────────────────┐     ┌─────────────────────┐        ┌────────────────┐
│ PROVIDERS = [           │     │ ProviderEngine       │        │ openai.ts      │
│   { id: 'openai',      │──▶  │                      │──▶     │ anthropic.ts   │
│     name: 'OpenAI',    │     │  registry lookup     │        │ ollama.ts      │
│     models: [...],     │     │  resolve model       │        │ groq.ts        │
│     needsEndpoint: F   │     │  resolve apiKey      │        │ gemini.ts      │
│   },                   │     │  resolve endpoint    │        │ deepseel.ts    │
│   ...                 │     │  call provider fn     │        │ mistral.ts     │
│ ]                      │     └─────────────────────┘        │ ...            │
│                        │                                     └────────────────┘
│ shared/providers.ts    │
│                        │     Settings (compact)              Provider API files
│ ProviderUIConfig        │     ┌─────────────────────┐        Each exports:
│ ProviderRuntimeConfig   │     │ [Search provider..] │        ┌────────────────┐
│                         │     │ ┌─────────────────┐ │        │ generate()     │
│ Registry pattern like   │     │ │ ☑ OpenAI      │ │        │ defaultModel   │
│ frameworks.ts           │     │ │ ☐ Anthropic   │ │        │ defaultEndpoint│
│                         │     │ │ ☐ Groq        │ │        └────────────────┘
│ Minimal boilerplate     │     │ │ ☐ Gemini      │ │
│ per provider:           │     │ └─────────────────┘ │
│  1. config entry        │     │                     │
│  2. api function        │     │ [Active provider     │
│                         │     │  settings expand]    │
└─────────────────────────┘     └─────────────────────┘
```

## 2. TypeScript Interfaces

### 2.1 Provider Definition (Registry Entry)

```typescript
// src/shared/providers.ts

/** Categories for organizing providers in the UI */
export type ProviderCategory = 'cloud' | 'local' | 'router';

/**
 * A provider's runtime configuration as stored in settings.
 * This is the normalized shape: every provider reduces to these fields.
 */
export interface ProviderConfig {
  /** The provider ID (e.g. 'openai', 'groq') */
  providerId: string;
  /** Selected model name */
  model: string;
  /** Optional custom endpoint (for local/Ollama/Azure) */
  endpoint?: string;
}

/**
 * Static definition of a provider — registered once, never changes at runtime.
 * This is the "data" half of the provider system.
 */
export interface ProviderDefinition {
  /** Unique identifier, kebab-case (e.g. 'openai', 'google-gemini') */
  id: string;
  /** Human-readable name (e.g. 'OpenAI', 'Google Gemini') */
  name: string;
  /** Short description shown in the provider switcher */
  description: string;
  /** Category for UI grouping */
  category: ProviderCategory;
  /** Available models for this provider */
  models: string[];
  /** The default model to select when first configuring */
  defaultModel: string;
  /** Default API endpoint (e.g. 'https://api.openai.com/v1') */
  defaultEndpoint?: string;
  /** Whether this provider requires a custom endpoint (Ollama, Azure) */
  needsEndpoint: boolean;
  /** Website URL for the provider (for "get API key" links) */
  website: string;
  /** Whether this provider needs an API key */
  needsApiKey: boolean;
  /** Optional accent color for UI badges */
  color?: string;
}

/**
 * Runtime callable for a provider.
 * This is the "behavior" half — registered alongside the definition.
 */
export interface ProviderImplementation {
  /** Provider ID this implementation belongs to */
  providerId: string;
  /**
   * Generate a completion from this provider.
   * Every provider reduces to: model + prompt + (optional) apiKey + (optional) endpoint = string response.
   */
  generate: (options: {
    model: string;
    prompt: string;
    apiKey?: string;
    endpoint?: string;
    signal?: AbortSignal;
  }) => Promise<string>;
  /**
   * Optional health check (e.g. Ollama status, API key validation).
   * Returns true if the provider is reachable with the given config.
   */
  check?: (options: { endpoint?: string; apiKey?: string }) => Promise<{ available: boolean; message?: string }>;
}
```

### 2.2 AppSettings (Evolved)

The current `AppSettings` has per-provider fields baked in. The new version uses a dynamic map:

```typescript
// In src/shared/types.ts

export type ProviderType = string; // Was: 'ollama' | 'openai' | 'anthropic'
// ProviderType is now an open string — any registered provider ID.

export interface AppSettings {
  /** Currently active provider ID */
  activeProvider: string; // was ProviderType union

  /** Per-provider runtime config, keyed by provider ID */
  providerConfigs: Record<string, ProviderConfig>;

  // These stay as-is (not provider-related):
  hotkeyToggle: string;
  hotkeyMic: string;
}

/** The stored shape for one provider's config */
export interface ProviderConfig {
  model: string;
  endpoint?: string;
  // NOTE: apiKey is NOT stored here — it lives in Electron safeStorage.
}
```

### 2.3 Provider Registry (Runtime)

```typescript
// src/main/llm/provider-registry.ts

/**
 * The central provider registry.
 * Holds all definitions and implementations, and resolves requests.
 */
class ProviderRegistry {
  private definitions = new Map<string, ProviderDefinition>();
  private implementations = new Map<string, ProviderImplementation>();

  /** Register a provider (definition + implementation together) */
  register(provider: {
    definition: ProviderDefinition;
    implementation: ProviderImplementation;
  }): void;

  /** Get a provider definition */
  getDefinition(id: string): ProviderDefinition | undefined;

  /** Get a provider's generate function */
  getGenerate(id: string): ProviderImplementation['generate'];

  /** List all registered providers */
  listDefinitions(): ProviderDefinition[];

  /** Get providers by category */
  listByCategory(category: ProviderCategory): ProviderDefinition[];
}
```

## 3. File/Module Map

```
src/
├── shared/
│   ├── types.ts                     # Updated: ProviderType = string, AppSettings refactored
│   ├── api-types.ts                 # Updated: PrompterApi.ollama.check → provider.check
│   ├── providers.ts                 # ★ NEW: ProviderDefinition, ProviderConfig interfaces
│   └── provider-definitions.ts     # ★ NEW: The PROVIDERS registry array (data only)
│       └── (static list of all provider definitions with models, categories, etc.)
│
├── main/
│   ├── ipc.ts                       # Updated: dynamic VALID_SERVICES, generic provider IPC
│   ├── storage.ts                   # Minor: remove VALID_SERVICES hardcoded set
│   └── llm/
│       ├── provider-registry.ts     # ★ NEW: Central registry class
│       ├── provider-engine.ts       # ★ NEW: Orchestrator replacement — resolves + calls
│       ├── orchestrator.ts          # REFACTORED: Thin wrapper around provider-engine
│       ├── implementations/
│       │   ├── openai.ts            # REFACTORED: Exports ProviderImplementation
│       │   ├── anthropic.ts         # REFACTORED: Exports ProviderImplementation
│       │   ├── ollama.ts            # REFACTORED: Exports ProviderImplementation
│       │   ├── groq.ts              # ★ NEW
│       │   ├── gemini.ts            # ★ NEW
│       │   ├── deepseek.ts          # ★ NEW
│       │   ├── mistral.ts           # ★ NEW
│       │   ├── perplexity.ts        # ★ NEW
│       │   ├── together.ts          # ★ NEW
│       │   ├── openrouter.ts        # ★ NEW
│       │   ├── fireworks.ts         # ★ NEW
│       │   ├── grok.ts              # ★ NEW
│       │   ├── cohere.ts            # ★ NEW
│       │   └── azure-openai.ts      # ★ NEW (optional — has endpoint + key, different pattern)
│       └── index.ts                 # ★ NEW: Auto-registers all implementations into registry
│
└── renderer/
    ├── components/
    │   ├── SettingsPanel.tsx         # REFACTORED: Dynamic provider cards
    │   ├── ProviderSwitcher.tsx      # ★ NEW: Searchable provider dropdown
    │   └── ProviderConfigCard.tsx     # ★ NEW: Collapsible per-provider config
    └── stores/
        └── settings-store.ts         # REFACTORED: Dynamic provider state
```

## 4. Provider Registration Pattern

### 4.1 The Minimal Boilerplate

Adding a new provider requires exactly **two things**:

**Step 1 — Add definition to the shared registry** (`src/shared/provider-definitions.ts`):

```typescript
// One line in the PROVIDERS array
{
  id: 'groq',
  name: 'Groq',
  description: 'Fast inference, free tier available',
  category: 'cloud',
  models: [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
  ],
  defaultModel: 'llama-3.3-70b-versatile',
  defaultEndpoint: 'https://api.groq.com/openai/v1',
  needsEndpoint: false,
  needsApiKey: true,
  website: 'https://console.groq.com/keys',
  color: '#f55036',
}
```

**Step 2 — Add implementation file** (`src/main/llm/implementations/groq.ts`):

```typescript
// ~40 lines — the function + registration wrapper
import type { ProviderImplementation } from './types';

const GROQ_DEFAULT_URL = 'https://api.groq.com/openai/v1';

export const groqImpl: ProviderImplementation = {
  providerId: 'groq',
  generate: async ({ model, prompt, apiKey, endpoint }) => {
    // Uses OpenAI-compatible API — often a thin wrapper around fetchWithTimeout
    const url = `${endpoint ?? GROQ_DEFAULT_URL}/chat/completions`;
    // ... standard fetch + parse, ~30 lines
    return content;
  },
};
```

**That's it.** Two files, one data object, one function. The registry auto-discovers all implementations.

### 4.2 Registry Auto-Discovery

```typescript
// src/main/llm/index.ts — one-time setup

import { ProviderRegistry } from './provider-registry';
import { PROVIDER_DEFINITIONS } from '@/shared/provider-definitions';
import { openaiImpl } from './implementations/openai';
import { anthropicImpl } from './implementations/anthropic';
import { ollamaImpl } from './implementations/ollama';
import { groqImpl } from './implementations/groq';
// ... etc

export function createProviderRegistry(): ProviderRegistry {
  const registry = new ProviderRegistry();

  const implementations = [
    openaiImpl, anthropicImpl, ollamaImpl,
    groqImpl, geminiImpl, /* ... */,
  ];

  for (const impl of implementations) {
    const definition = PROVIDER_DEFINITIONS.find(d => d.id === impl.providerId);
    if (!definition) {
      console.warn(`Provider implementation "${impl.providerId}" has no definition`);
      continue;
    }
    registry.register({ definition, implementation: impl });
  }

  return registry;
}
```

## 5. UI Switching Mechanism — Design

### 5.1 Principle: No UI Pollution

The core requirement: **do not put 15 provider sections in the settings panel.** Instead, the active provider is all you see. Switching happens through a compact, searchable palette.

### 5.2 Provider Switcher Component

`ProviderSwitcher.tsx` replaces the current 3-item dropdown:

```
┌──────────────────────────────────────────────┐
│  🔍 Search providers...                     │  ← text input, auto-focus
├──────────────────────────────────────────────┤
│  RECENTLY USED                               │  ← section header (if any)
│  ○ Groq           llama-3.3-70b-versatile   │  ← last used provider
│                                              │
│  ☁  CLOUD                                    │  ← category group
│  ● OpenAI         gpt-4o                    │  ← currently active (filled dot)
│  ○ Anthropic      claude-sonnet-4           │
│  ○ Groq           llama-3.3-70b             │
│  ○ Google Gemini  gemini-2.0-flash          │
│  ○ DeepSeek       deepseek-chat             │
│  ○ Mistral AI     mistral-large             │
│  ○ Perplexity     sonar-pro                 │
│  ○ Together AI    mixtral-8x7b             │
│  ○ Fireworks AI   llama-v3p1-70b           │
│  ○ xAI/Grok       grok-2                   │
│  ○ Cohere         command-r-plus           │
│                                              │
│  🖥  LOCAL                                    │
│  ○ Ollama         llama3.2 (local)          │  ← local badge
│                                              │
│  🔀  ROUTER                                   │
│  ○ OpenRouter     auto                     │  ← unified key
└──────────────────────────────────────────────┘
```

**Keyboard shortcut**: `Cmd+P` or `Ctrl+P` opens the provider switcher from anywhere in the app (not just settings). This satisfies "no UI pollution" — switching is a power-user action, not a persistent UI element.

### 5.3 Active Provider Settings

Only the **currently active provider** shows its configuration below the switcher:

```
┌──────────────────────────────────────────────┐
│  Provider                                   │
│  ┌──────────────────────────────────┐       │
│  │ (●) OpenAI     gpt-4o        ▼  │       │  ← switcher (compact)
│  └──────────────────────────────────┘       │
│                                              │
│  ┌──────────────────────────────────┐       │
│  │ OPENAI (configured ✔)           │       │  ← provider card, expanded
│  │ Model:    [gpt-4o          ▼]   │       │     because it's active
│  │ API Key:  [·················]   │       │
│  │                     [Save]      │       │
│  └──────────────────────────────────┘       │
│                                              │
│  ┌──────────────────────────────────┐       │
│  │ + Anthropic                     │       │  ← collapsed (not active)
│  │ + Groq                          │       │     click to expand
│  │ + Google Gemini                 │       │
│  └──────────────────────────────────┘       │
└──────────────────────────────────────────────┘
```

### 5.4 "Configured" Badge

Providers that have a valid API key stored get a visual indicator:

- **Green dot** next to the name = API key saved
- **No dot** = not yet configured
- **Active provider** = filled circle regardless

This lets the user see at a glance which providers are ready to use.

### 5.5 Recently Used Tracking

A `recentProviders: string[]` field in AppSettings (max 3-5 entries) tracks the last used providers. These float to the top of the switcher for quick access.

## 6. API Key Management

### 6.1 Current Pattern (Works Well)

The existing `storage.ts` + `safeStorage` approach is already generic:
- `saveApiKey(service: string, key: string)` — service = provider ID
- `getApiKey(service: string): string | null`

The only change: remove the `VALID_SERVICES` hardcoded set in `ipc.ts`.

### 6.2 Key Storage Flow

```
User enters key → stored in Electron safeStorage (encrypted at rest)
                → NOT stored in AppSettings JSON (plaintext risk)

On load:
  settings-store calls getApiKey(providerId) for EACH registered provider
  → populates in-memory map: providerApiKeys: Record<string, string>
  → does NOT put them in AppSettings (stays in memory only)

On generate:
  orchestrator looks up key by active provider ID
  → if found, passes to provider implementation
  → if missing, shows "Configure API key" prompt
```

### 6.3 OpenRouter as Universal Key

Optionally, if the user configures OpenRouter with a single API key, we can offer a "Use OpenRouter for all" toggle. This would:
- Route ALL provider selections through OpenRouter
- Use the OpenRouter model name mapping (e.g. `openai/gpt-4o`, `anthropic/claude-sonnet-4`)
- Eliminate the need for individual provider keys

This is an additive feature — not in V1 of the redesign.

## 7. Provider Engine (Replaces Orchestrator)

The new `provider-engine.ts` replaces the orchestrator's switch statement with dynamic resolution:

```typescript
// src/main/llm/provider-engine.ts

export class ProviderEngine {
  private registry: ProviderRegistry;
  private keyStore: { getApiKey(service: string): string | null };

  constructor(registry: ProviderRegistry, keyStore: KeyStore) {
    this.registry = registry;
    this.keyStore = keyStore;
  }

  async generate(options: {
    providerId: string;
    model: string;
    endpoint?: string;
    prompt: string;
  }): Promise<string> {
    const def = this.registry.getDefinition(options.providerId);
    if (!def) throw new Error(`Unknown provider: ${options.providerId}`);

    const apiKey = def.needsApiKey ? this.keyStore.getApiKey(options.providerId) : undefined;
    if (def.needsApiKey && !apiKey) {
      throw new Error(`${def.name} API key not configured`);
    }

    const generate = this.registry.getGenerate(options.providerId);
    return generate({
      model: options.model,
      prompt: options.prompt,
      apiKey: apiKey ?? undefined,
      endpoint: options.endpoint ?? def.defaultEndpoint,
    });
  }
}
```

## 8. Settings Store Evolution

The renderer-side store becomes dynamic:

```typescript
// In settings-store.ts — conceptual shape

interface SettingsStore {
  // Current active provider
  activeProvider: string;

  // Dynamic map of provider configs (loaded from settings)
  providerConfigs: Record<string, { model: string; endpoint?: string }>;

  // In-memory API keys (loaded from safeStorage, NEVER persisted to JSON)
  providerApiKeys: Record<string, string>;

  // Provider registry (from shared, available on renderer too)
  providers: ProviderDefinition[];

  // Recently used (for UI sorting)
  recentProviders: string[];

  // Computed: which providers have keys configured
  configuredProviders: Set<string>;

  // Actions
  setActiveProvider: (id: string) => void;
  updateProviderConfig: (id: string, config: Partial<ProviderConfig>) => void;
  saveApiKey: (id: string, key: string) => Promise<void>;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}
```

## 9. Migration Path

### Phase 1 — Foundation (no behavior change)

1. Create `src/shared/providers.ts` with interfaces
2. Create `src/shared/provider-definitions.ts` with existing 3 providers
3. Create `src/main/llm/provider-registry.ts` (the class)
4. Create `src/main/llm/index.ts` (registration bootstrap)
5. Refactor `openai.ts`, `anthropic.ts`, `ollama.ts` to export `ProviderImplementation`
6. Create `src/main/llm/provider-engine.ts`
7. Rewrite `orchestrator.ts` as thin wrapper around `ProviderEngine`

**Validation**: All existing functionality works identically. No UI changes.

### Phase 2 — Provider Explosion (add 10+ providers)

For each new provider:
1. Add definition entry to `provider-definitions.ts`
2. Create implementation file in `implementations/`
3. Register in `src/main/llm/index.ts`

Order of addition (by complexity):
1. **Groq** — OpenAI-compatible API (identical to openai.ts, just different URL)
2. **DeepSeek** — OpenAI-compatible API
3. **Together AI** — OpenAI-compatible API
4. **Fireworks AI** — OpenAI-compatible API
5. **Perplexity** — OpenAI-compatible API
6. **xAI/Grok** — OpenAI-compatible API
7. **Mistral AI** — OpenAI-compatible API (slightly different auth header)
8. **Cohere** — different API shape
9. **Google Gemini** — different API shape
10. **OpenRouter** — special (router, many models)
11. **Azure OpenAI** — needs endpoint + key (different endpoint pattern)

### Phase 3 — UI Redesign

1. Create `ProviderSwitcher.tsx` (searchable dropdown with categories)
2. Create `ProviderConfigCard.tsx` (dynamic, data-driven config panel)
3. Rewrite `SettingsPanel.tsx` to use dynamic provider cards
4. Update `settings-store.ts` for dynamic state
5. Add keyboard shortcut (Cmd+P) for quick switching

### Phase 4 — Polish

1. Recently used providers tracking
2. "Configured" badges
3. OpenRouter universal key mode (optional)
4. Provider search history

## 10. Implementation Contract for a Provider File

Every provider implementation file must follow this contract:

```typescript
// src/main/llm/implementations/types.ts (shared type)

export interface ProviderImplementation {
  providerId: string;
  generate: (opts: {
    model: string;
    prompt: string;
    apiKey?: string;
    endpoint?: string;
    signal?: AbortSignal;
  }) => Promise<string>;
  check?: (opts: {
    endpoint?: string;
    apiKey?: string;
  }) => Promise<{ available: boolean; message?: string }>;
}
```

### Reference: OpenAI as ProviderImplementation

```typescript
// src/main/llm/implementations/openai.ts

import { fetchWithTimeout } from '../fetch-with-timeout';

const DEFAULT_URL = 'https://api.openai.com/v1';

export const openaiImpl: ProviderImplementation = {
  providerId: 'openai',

  generate: async ({ model, prompt, apiKey, endpoint }) => {
    const baseUrl = (endpoint ?? DEFAULT_URL).replace(/\/+$/, '');
    const res = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try { const err = await res.json() as any; if (err.error?.message) detail += ` — ${err.error.message}`; } catch {}
      throw new Error(`OpenAI API error: ${detail}`);
    }

    const data = await res.json() as { choices?: { message?: { content?: string | null } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (content === undefined || content === null) throw new Error('OpenAI: no content in response');
    return content;
  },
};
```

### Reference: Ollama as ProviderImplementation (special case, no API key)

```typescript
// src/main/llm/implementations/ollama.ts

import { fetchWithTimeout } from '../fetch-with-timeout';

const DEFAULT_URL = 'http://localhost:11434';

export const ollamaImpl: ProviderImplementation = {
  providerId: 'ollama',

  generate: async ({ model, prompt, endpoint }) => {
    const baseUrl = (endpoint ?? DEFAULT_URL).replace(/\/+$/, '');
    const res = await fetchWithTimeout(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
    });
    if (!res.ok) throw new Error(`Ollama error (${res.status})`);
    const data = await res.json();
    return data.response as string;
  },

  check: async ({ endpoint }) => {
    const baseUrl = (endpoint ?? DEFAULT_URL).replace(/\/+$/, '');
    try {
      const [tagsRes] = await Promise.all([
        fetchWithTimeout(`${baseUrl}/api/tags`, { method: 'GET', timeout: 5000 }),
      ]);
      return { available: tagsRes.ok };
    } catch {
      return { available: false, message: 'Ollama not reachable' };
    }
  },
};
```

## 11. CSP Considerations

Current CSP: `connect-src 'self' http://localhost:11434`

Each provider needs its endpoint in the CSP. For the 10+ cloud providers, this becomes unwieldy. Two approaches:

**Option A: Allow all HTTPS** (recommended)
```
connect-src 'self' http://localhost:11434 https://api.openai.com https://api.anthropic.com ...
```
Pro: Explicit, secure. Con: Needs updating per provider.

**Option B: Wildcard HTTPS** (pragmatic)
```
connect-src 'self' http://localhost:11434 https://*
```
Pro: Future-proof, no per-provider updates. Con: Less restrictive.

**Recommendation**: Option A initially, with a build-time script that generates CSP from `provider-definitions.ts` default endpoints. This keeps it explicit but automated.

## 12. Key Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Provider interface shape | `{ model, apiKey?, endpoint? }` | Every provider reduces to these fields. Exceptions (Ollama no-key, Azure custom endpoint) handled via `needsApiKey`/`needsEndpoint` flags |
| Registry pattern | Array + Map, like `frameworks.ts` | Proven pattern in codebase, minimal boilerplate |
| API key storage | Electron safeStorage (keep current) | Already works, already generic by `service` string |
| Settings storage | Dynamic `Record<string, ProviderConfig>` | Avoids per-provider fields in AppSettings |
| Provider switching | Searchable categorized dropdown + Cmd+P shortcut | "Solves" the 15-provider problem without UI pollution |
| UI config pattern | Only active provider expanded, others collapsed + "Configured" badges | Scales to any number of providers |
| New provider cost | 1 definition entry + 1 implementation file (~40 lines total) | Minimal friction encourages adding all providers |
| Provider file pattern | Export `ProviderImplementation` object | Consistent, testable, auto-registerable |
| Orchestrator replacement | `ProviderEngine` class with registry | Eliminates the switch statement entirely |

---

## Appendix A: Complete Provider List

| # | Provider | Category | API Shape | Key Feature |
|---|----------|----------|-----------|-------------|
| 1 | Ollama | local | endpoint + model | Free, local, no API key |
| 2 | OpenAI | cloud | key + model | GPT-4o, o3, o4-mini |
| 3 | Anthropic | cloud | key + model | Claude Sonnet 4, Opus 4 |
| 4 | Groq | cloud | key + model | Fast inference, free tier |
| 5 | Google Gemini | cloud | key + model | Gemini 2.0 Flash/Pro |
| 6 | DeepSeek | cloud | key + model | Cheap, strong reasoning |
| 7 | Mistral AI | cloud | key + model | Mistral Large, Codestral |
| 8 | Perplexity | cloud | key + model | Sonar Pro, online search |
| 9 | Together AI | cloud | key + model | Many open models |
| 10 | Fireworks AI | cloud | key + model | Fast open models |
| 11 | xAI/Grok | cloud | key + model | Grok 2 |
| 12 | Cohere | cloud | key + model | Command R+, embedding |
| 13 | OpenRouter | router | key + model | One key for all models |
| 14 | Azure OpenAI | cloud | key + endpoint + model | Enterprise OpenAI |

All follow `{ model, apiKey?, endpoint? }` with `needsApiKey`/`needsEndpoint` flags.
