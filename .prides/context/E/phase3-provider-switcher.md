# Phase 3: ProviderSwitcher.tsx — Searchable Provider Palette

## Issue: ISS-0008

## Goal
Create `src/renderer/components/ProviderSwitcher.tsx` — a searchable, categorized provider selector dropdown.

## Props
```typescript
interface ProviderSwitcherProps {
  open: boolean;
  onClose: () => void;
  onSelect: (providerId: string) => void;
  activeProvider: string;
  configuredProviders: Set<string>;
}
```

## UI Layout
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

## Behavior
1. **Auto-focus** the search input when opened
2. **Filter** providers as user types (fuzzy match on name + description)
3. **Categories**: Cloud providers, Local (Ollama), Router (OpenRouter) — use `provider.category`
4. **Active indicator**: Filled dot (●) for currently active provider
5. **Configured badge**: ✓ green checkmark for providers with saved API keys
6. **Keyboard navigation**: Up/Down arrows, Enter to select, Escape to close
7. **Click outside**: Closes
8. **Model name**: Show current model next to provider name

## Data Source
Import from `@/shared/provider-definitions`:
```typescript
import { PROVIDER_DEFINITIONS, getProviderDefinition } from '@/shared/provider-definitions';
import type { ProviderDefinition, ProviderCategory } from '@/shared/providers';
```

PROVIDER_DEFINITIONS is an array of ProviderDefinition objects:
```typescript
interface ProviderDefinition {
  id: string;
  name: string;
  description: string;
  category: 'cloud' | 'local' | 'router';
  models: string[];
  defaultModel: string;
  color?: string;
  // ...
}
```

## Styling
- Use Tailwind CSS classes (consistent with existing components)
- Dark theme with `bg-surface`, `border-border`, `text-white/80`, etc.
- Same card style as other panels (`sub-card`, `btn-subtle`, `input-base` classes exist)
- Max height with overflow scroll
- Z-index: z-50 (dropdown overlay)

## Dependencies
- React, lucide-react (Check, Search, ChevronDown icons)
- `@/shared/provider-definitions` — PROVIDER_DEFINITIONS
- `@/shared/providers` — types

## Verification
```bash
pnpm typecheck    # 0 errors
pnpm lint         # 0 errors
```
