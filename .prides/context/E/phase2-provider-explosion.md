# Phase 2: Provider Explosion — Add 6+ New Providers

## Goal
Add new LLM providers using the registry pattern established in Phase 1. Each provider requires exactly 2 additions:
1. **Definition entry** in `src/shared/provider-definitions.ts` (one object in the PROVIDERS array)
2. **Implementation file** in `src/main/llm/implementations/{name}.ts` (~40 lines)

## Prerequisites (already done in Phase 1)
- Registry infrastructure exists (`provider-registry.ts`, `provider-engine.ts`, `index.ts`)
- Path alias `@/` → `./src/*`
- All 3 original providers are registered and working
- All verification passes (typecheck 0, lint 0, tests 25/25, build clean)

## Providers to Add (in this order)

### Group A — OpenAI-Compatible (identical API shape to openai.ts)
These all use POST to `${endpoint}/chat/completions` with Bearer token auth and the same request/response format as OpenAI. Each implementation file is essentially a copy of openai.ts with different defaults.

| # | Provider | Default Endpoint | Default Model | Color |
|---|----------|-----------------|---------------|-------|
| 1 | Groq | https://api.groq.com/openai/v1 | llama-3.3-70b-versatile | #f55036 |
| 2 | DeepSeek | https://api.deepseek.com | deepseek-chat | #4f6bf2 |
| 3 | Together AI | https://api.together.xyz/v1 | meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo | #ff6b35 |
| 4 | Fireworks AI | https://api.fireworks.ai/inference/v1 | accounts/fireworks/models/llama-v3p1-70b-instruct | #ff4500 |
| 5 | Perplexity | https://api.perplexity.ai | sonar-pro | #36d399 |
| 6 | xAI/Grok | https://api.x.ai/v1 | grok-2 | #1d9bf0 |

### Group B — Different API Shapes (more complex)
| 7 | Mistral AI | https://api.mistral.ai/v1 | mistral-large-latest | #ff6b35 |
| 8 | Google Gemini | https://generativelanguage.googleapis.com/v1beta | gemini-2.0-flash | #4285f4 |
| 9 | Cohere | https://api.cohere.com/v2 | command-r-plus | #39594d |
| 10 | OpenRouter | https://openrouter.ai/api/v1 | auto | #8b5cf6 |

## File Changes

### 1. `src/shared/provider-definitions.ts` — Add new entries to PROVIDERS array
Each entry follows this shape:
```typescript
{
  id: 'groq',
  name: 'Groq',
  description: 'Fast inference, free tier available',
  category: 'cloud',
  models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
  defaultModel: 'llama-3.3-70b-versatile',
  defaultEndpoint: 'https://api.groq.com/openai/v1',
  needsEndpoint: false,
  needsApiKey: true,
  website: 'https://console.groq.com/keys',
  color: '#f55036',
}
```

### 2-11. New implementation files in `src/main/llm/implementations/`

**OpenAI-compatible pattern** (for Groq, DeepSeek, Together, Fireworks, Perplexity, xAI/Grok, Mistral):
```typescript
import { fetchWithTimeout } from '../fetch-with-timeout';
import type { ProviderImplementation } from '@/shared/providers';

const DEFAULT_URL = 'https://api.groq.com/openai/v1';

export const groqImpl: ProviderImplementation = {
  providerId: 'groq',
  generate: async ({ model, prompt, apiKey, endpoint, signal }) => {
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
      signal,
    });
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try { const err = await res.json() as any; if (err.error?.message) detail += ` — ${err.error.message}`; } catch {}
      throw new Error(`Groq API error: ${detail}`);
    }
    const data = await res.json() as { choices?: { message?: { content?: string | null } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (content === undefined || content === null) throw new Error('Groq: no content in response');
    return content;
  },
};
```

**Gemini pattern** (different API shape):
```typescript
const DEFAULT_URL = 'https://generativelanguage.googleapis.com/v1beta';
export const geminiImpl: ProviderImplementation = {
  providerId: 'gemini',
  generate: async ({ model, prompt, apiKey, endpoint, signal }) => {
    const baseUrl = (endpoint ?? DEFAULT_URL).replace(/\/+$/, '');
    const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
      signal,
    });
    // Parse: data.candidates[0].content.parts[0].text
  },
};
```

**OpenRouter pattern** (router, model names like 'openai/gpt-4o'):
```typescript
// Similar to OpenAI but adds "HTTP-Referer" and "X-Title" headers for ranking
```

### 12. `src/main/llm/index.ts` — Register new providers
Add imports for each new implementation and register them in the createProviderRegistry function.

```typescript
import { groqImpl } from './implementations/groq';
import { deepseekImpl } from './implementations/deepseek';
// ... etc

// In createProviderRegistry:
const implementations = [
  openaiImpl, anthropicImpl, ollamaImpl,
  groqImpl, deepseekImpl, togetherImpl,
  fireworksImpl, perplexityImpl, xaiImpl,
];
```

## Verification
```bash
pnpm typecheck    # 0 errors
pnpm lint         # 0 errors, 0 warnings
pnpm test run     # 25/25 tests
pnpm build        # clean dist
```

## What NOT to Touch
- src/main/llm/orchestrator.ts — untouched (registry handles resolution)
- src/main/ipc.ts — untouched (VALID_SERVICES already dynamic)
- Any renderer files — UI updates come in Phase 3
- Any test files
- types.ts, api-types.ts, preload/index.ts

## Implementation Order
1. Add all Group A definitions to provider-definitions.ts first (6 entries)
2. Create 6 implementation files (each ~40 lines, OpenAI-compatible)
3. Update index.ts to register them
4. Run verification
5. Then add Group B (Mistral, Gemini, Cohere, OpenRouter) — different API shapes
