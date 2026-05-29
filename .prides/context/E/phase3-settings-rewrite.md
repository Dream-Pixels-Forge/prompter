# Phase 3: SettingsPanel.tsx — Rewrite with Dynamic Components

## Issue: ISS-0010

## Goal
Rewrite `src/renderer/components/SettingsPanel.tsx` from 265 lines of hardcoded 3-provider sections to a ~60-line dynamic component.

## Also Create
`src/renderer/components/ProviderSettings.tsx` — The composed provider settings section that is the parent container.

## New Architecture

### ProviderSettings.tsx (NEW)
The composed provider settings section:
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
│ │ ✓ Anthropic   (configured)      ││ ← collapsed card, green check
│ └──────────────────────────────────┘│
│ ┌──────────────────────────────────┐│
│ │ ○ Groq                          ││ ← collapsed, not configured
│ └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

ProviderSettings loads provider data and renders:
1. A compact inline provider select (SimulatedDropdown-style, like the current provider select)
2. ProviderConfigCard for active provider (expanded)
3. ProviderConfigCards for all other providers (collapsed)

### SettingsPanel.tsx (REWRITE)
Replace all hardcoded sections with just:
```typescript
export function SettingsPanel() {
  const store = useSettingsStore();
  const showToast = useAppStore((s) => s.showToast);
  
  useEffect(() => { store.loadSettings(); }, []);
  
  return (
    <div className="space-y-3">
      <ProviderSettings />
      {/* Other settings sections like hotkeys can remain */}
    </div>
  );
}
```

## What to Remove from SettingsPanel
- PROVIDERS constant (lines 30-34)
- FormRow component (lines 36-43)
- All Ollama config section (lines 150-186)
- All OpenAI config section (lines 190-224)
- All Anthropic config section (lines 228-262)
- The provider dropdown (lines 99-146) — replaced by ProviderSwitcher inline
- debounce logic — let the new components handle saves

## What to Keep in SettingsPanel
- Hotkey settings (hotkeyToggle, hotkeyMic)
- Any other non-provider settings sections
- The overall layout/container

Actually, looking at the current SettingsPanel, it ONLY has provider settings. So the rewrite should create a clean new component that only uses ProviderSettings.

For a minimal diff, let me:
1. Rewrite SettingsPanel to use ProviderSettings
2. The hotkey config is still there via the store (just in a simpler section)

Actually, the current SettingsPanel has NO hotkey settings visible in the UI — looking at the code, it only has provider sections. So the rewrite is simple: just use ProviderSettings.

## Key Considerations
- Remove direct imports of ANTHROPIC_MODELS, OPENAI_MODELS, ProviderType
- Update imports to use ProviderDefinition and provider-definitions
- Store still needs loadSettings on mount

## Dependencies
- `@/renderer/stores/settings-store` — useSettingsStore
- `@/renderer/stores/app-store` — useAppStore (for toast)
- `./ProviderSettings` — new component
- `./ProviderSwitcher` — new component
- `./ProviderConfigCard` — new component

## Verification
```bash
pnpm typecheck    # 0 errors
pnpm lint         # 0 errors
pnpm test run     # 25/25 tests
pnpm build        # clean dist
```
