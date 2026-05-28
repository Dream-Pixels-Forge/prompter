# Phase 1: Provider Architecture Foundation

## Goal
Refactor the 3 existing LLM providers (OpenAI, Anthropic, Ollama) into a **registry pattern** without changing any behavior. No UI changes, no new features. All existing tests must pass.

## Design Summary
Replace the switch-statement in orchestrator.ts with a ProviderRegistry + ProviderEngine. Each provider exports a `ProviderImplementation` object. The orchestrator becomes a thin adapter that bridges the old flat config to the new dynamic resolution.

## Project Details
- **TypeScript**, `@/` → `./src/*` (path alias in tsconfig.json)
- **Zustand** for state management (renderer only)
- **Electron** with IPC between main/renderer
- **safeStorage** for encrypted API key storage
- Tests: `vitest` in `src/__tests__/`
- Task runner: `pnpm` (packageManager: pnpm@11.1.1)

## Files to Create (8 new)

### 1. `src/shared/providers.ts` — Core type definitions
```typescript
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
```

### 2. `src/shared/provider-definitions.ts` — Static PROVIDERS array
Import `ProviderDefinition` from `./providers`. Export `PROVIDER_DEFINITIONS: ProviderDefinition[]` and `getProviderDefinition(id: string)` helper.

Three entries:
- **ollama**: local, no API key, needs endpoint, defaultModel 'llama3.2', defaultEndpoint 'http://localhost:11434', color '#ff6b35', models [] (fetched at runtime)
- **openai**: cloud, needs API key, defaultModel 'gpt-4o', defaultEndpoint 'https://api.openai.com/v1', color '#00a67e', models ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'o3', 'o4-mini']
- **anthropic**: cloud, needs API key, defaultModel 'claude-sonnet-4-20250514', defaultEndpoint 'https://api.anthropic.com', color '#d4a574', models ['claude-sonnet-4-20250514', 'claude-sonnet-4', 'claude-haiku-3-5-20241022', 'claude-opus-4-20250514']

### 3. `src/main/llm/provider-registry.ts` — Registry class
```typescript
export class ProviderRegistry {
  private definitions = new Map<string, ProviderDefinition>();
  private implementations = new Map<string, ProviderImplementation>();

  register(definition: ProviderDefinition, impl: ProviderImplementation): void
  getDefinition(id: string): ProviderDefinition | undefined
  getGenerate(id: string): ProviderImplementation['generate'] | undefined
  getCheck(id: string): ProviderImplementation['check'] | undefined
  listDefinitions(): ProviderDefinition[]
  listByCategory(category: ProviderCategory): ProviderDefinition[]
  has(id: string): boolean
}
```

### 4. `src/main/llm/provider-engine.ts` — Engine class
Accepts `ProviderRegistry` and `KeyStore` interface in constructor. Has `generate(opts)` and `check(opts)` methods. 

generate() logic:
1. Look up ProviderDefinition from registry
2. If needsApiKey and no apiKey passed, try keyStore.getApiKey(providerId)
3. If needsApiKey and still no key, throw descriptive error
4. Get generate function from registry
5. Use opts.endpoint ?? def.defaultEndpoint as endpoint
6. Call generate() with resolved params

KeyStore interface:
```typescript
export interface KeyStore {
  getApiKey(service: string): string | null;
}
```

### 5-7. Provider implementations (in `src/main/llm/implementations/`)

#### `implementations/openai.ts`
Export `openaiImpl: ProviderImplementation` with:
- providerId: 'openai'
- generate: POST to `${endpoint}/chat/completions`, Bearer auth, parse choices[0].message.content
- Use `fetchWithTimeout` from `../fetch-with-timeout`
- Error handling: HTTP status + error.message from response body, timeout

#### `implementations/anthropic.ts`
Export `anthropicImpl: ProviderImplementation` with:
- providerId: 'anthropic'
- generate: POST to `${endpoint}/v1/messages`, x-api-key header, anthropic-version '2023-06-01', max_tokens 4096, parse content[0].text
- Error handling: 401, 429, generic, timeout

#### `implementations/ollama.ts`
Export `ollamaImpl: ProviderImplementation` with:
- providerId: 'ollama'
- generate: POST to `${endpoint}/api/generate`, no auth, parse response
- check: GET `${endpoint}/api/tags` + `${endpoint}/api/version`, return { available, models, version }
- models type in check: `(tagsData.models ?? []).map((m: { name: string }) => m.name)`

ALSO export `checkOllamaStatus(baseUrl?: string): Promise<OllamaStatus>` for backward compatibility with IPC handler. Import `OllamaStatus` from `@/shared/types`. This function calls `ollamaImpl.check()` internally and returns the old shape.

### 8. `src/main/llm/index.ts` — Bootstrap
```typescript
export function createProviderRegistry(): ProviderRegistry
export function createProviderEngine(keyStore: KeyStore): ProviderEngine
```
- Imports all 3 implementations + PROVIDER_DEFINITIONS
- Creates registry, registers all implementations with their definitions
- Warns if an implementation has no matching definition (skip it)
- Engine constructor: `new ProviderEngine(registry, keyStore)`

## Files to Modify (2 existing)

### 9. `src/main/llm/orchestrator.ts` — Refactored
**Public API must stay identical:**
- `generatePrompt(req: GenerateRequest): Promise<GenerateResponse>`
- `updateConfig(config: Partial<...>): void`
- `buildSectionContent(key, input, sections): string`
- `extractDomain(input): string`
- `extractGoal(input): string`
- `extractAudienceTone(input): string`

**Internal changes:**

Old approach: switch(provider) in callLLM() calling openai.ts / anthropic.ts / ollama.ts directly.

New approach:
1. Create internal config bridge (maps flat fields to provider configs)
2. Create ProviderEngine once (lazy init) with a KeyStore that looks up from the in-memory apiKeys
3. Replace switch statement with `engine.generate({ providerId, model, prompt, endpoint, apiKey })`
4. The ProviderEngine resolves the implementation via registry — no switch needed

Architecture:
```typescript
let engine: ProviderEngine | null = null;
function getEngine() {
  if (!engine) {
    engine = createProviderEngine({ getApiKey: (s) => apiKeys[s] || null });
  }
  return engine;
}

// updateConfig stores flat fields into config map + apiKeys map
// generatePrompt reads config[activeProvider] and calls engine.generate()
// Error fallback: return local sections instead of throwing
```

Remove imports:
- `import { generateAnthropic } from './anthropic';` → deleted
- `import { checkOllamaStatus, generateOllama } from './ollama';` → deleted  
- `import { generateOpenAI } from './openai';` → deleted

Replace with:
- `import { createProviderEngine } from './index';`

### 10. `src/main/ipc.ts` — VALID_SERVICES → dynamic

Old:
```typescript
const VALID_SERVICES = new Set(['openai', 'anthropic']);
function validateService(service: string): void {
  if (!VALID_SERVICES.has(service)) { throw ... }
}
```

New:
```typescript
import { PROVIDER_DEFINITIONS } from '../shared/provider-definitions';

function validateService(service: string): void {
  if (!PROVIDER_DEFINITIONS.some(p => p.id === service)) {
    throw new Error(`Invalid service: '${service}'. Must be a registered provider.`);
  }
}
```

Also update import:
- `import { checkOllamaStatus } from './llm/ollama';` → `import { checkOllamaStatus } from './llm/implementations/ollama';`

## Files to Delete (3 old)

### 11-13. `src/main/llm/openai.ts`, `src/main/llm/anthropic.ts`, `src/main/llm/ollama.ts`

These are replaced by the implementations/*.ts files. Delete them after creating the new files.

## What NOT to Touch

- **types.ts** — keep `ProviderType` union and flat `AppSettings` for now
- **settings-store.ts** — keep flat fields, will refactor in Phase 3
- **SettingsPanel.tsx** — no UI changes in Phase 1
- **api-types.ts** — keep existing API shape
- **preload/index.ts** — keep existing context bridge
- **app-store.ts** — no changes needed
- **renderer/lib/llm.ts** — no changes needed
- Test files — must still pass

## Verification
```bash
pnpm typecheck    # must pass — 0 errors
pnpm lint         # must pass — 0 errors
pnpm test run     # must pass — 25/25 tests
pnpm build        # must pass — clean dist output
```

## Key Design Decisions
1. **Backward compat first**: Orchestrator keeps its old public API. Tested functions (buildSectionContent, extractDomain, etc.) remain untouched.
2. **No UI changes in Phase 1**: SettingsPanel and settings-store stay as-is. The registry infrastructure is invisible to the user.
3. **ProviderEngine passes apiKey**: In Phase 1, the orchestrator passes the resolved API key directly as an option. The KeyStore bridge exists for future use when providers self-resolve keys.
4. **Ollama dual export**: implementations/ollama.ts exports both `ollamaImpl` (for registry) and `checkOllamaStatus` (for backward-compat IPC handler).
5. **Error handling identical**: If LLM call fails, orchestrator falls back to local section generation (no throw).
