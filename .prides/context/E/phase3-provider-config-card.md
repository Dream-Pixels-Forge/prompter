# Phase 3: ProviderConfigCard.tsx — Dynamic Per-Provider Config Card

## Issue: ISS-0009

## Goal
Create `src/renderer/components/ProviderConfigCard.tsx` — a dynamic configuration card that renders per-provider settings from ProviderDefinition data.

## Props
```typescript
interface ProviderConfigCardProps {
  providerId: string;
  isActive: boolean;
  onSetActive: () => void;
}
```

The component reads its own data from the store and definitions.

## Expanded State (active provider)
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

## Collapsed State (non-active)
```
┌─────────────────────────────────────┐
│ ○ Anthropic             ✓ Configured│ ← name + configured badge
└─────────────────────────────────────┘
```

## Behavior
1. **Expanded when active**: Shows all config fields (model dropdown, API key, endpoint if needed)
2. **Collapsed when not active**: Shows minimal summary with configured badge
3. **Click on collapsed card**: Calls onSetActive to switch to that provider
4. **Model dropdown**: Populated from `providerDefinition.models` array
5. **API Key**: Password input, shows masked value, Save button stores via safeStorage
6. **Endpoint**: Only shown if `providerDefinition.needsEndpoint` is true
7. **Check button**: Calls `window.api.provider.check(providerId)` 
8. **Website link**: Opens `providerDefinition.website` in browser

## Data Sources
```typescript
import { getProviderDefinition } from '@/shared/provider-definitions';
import { useSettingsStore } from '@/renderer/stores/settings-store';
```

## Styling
- Same dark theme as other cards
- `sub-card` class for card container
- `input-base` class for inputs
- `btn-subtle` for buttons
- `<select>` with `appearance-none` and custom ChevronDown icon (same pattern as ModelDropdown in current SettingsPanel)

## Dependencies
- React, lucide-react (Check, Key, Globe, Cpu, ExternalLink, ChevronDown icons)
- `@/shared/provider-definitions` — getProviderDefinition
- `@/renderer/stores/settings-store` — useSettingsStore

## Verification
```bash
pnpm typecheck    # 0 errors
pnpm lint         # 0 errors
```
