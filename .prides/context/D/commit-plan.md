# Commit Plan — Bubble Removal + Fixes

## Files to Commit

### Deleted Files
- src/__tests__/migrate-position.test.ts — dead test for removed bubble positioning
- src/renderer/components/Bubble.tsx — bubble UI component (removed)
- src/renderer/hooks/useBubblePosition.ts — bubble position hook (removed)

### Modified Files
- .prides/observability.jsonl — swarm state
- .prides/state.json — swarm state
- dev_notes/SECURITY.md — rewritten to match actual implementation
- index.html — transparent body (no bg class)
- src/main/ipc.ts — removed bubble IPC handlers
- src/main/main.ts — removed disable-gpu, enable-transparent-visuals
- src/main/storage.ts — removed bubble position persistence
- src/preload/index.ts — removed bubble API section
- src/renderer/App.tsx — no bg-surface, always renders BubbleExpanded
- src/renderer/components/BubbleExpanded.tsx — glass-card, close calls window.toggle
- src/renderer/components/HistoryPanel.tsx — styling adjustments
- src/renderer/components/InputArea.tsx — styling adjustments
- src/renderer/components/MicButton.tsx — unused interimText→_interimText
- src/renderer/components/OutputPanel.tsx — styling adjustments
- src/renderer/components/PromptSection.tsx — styling adjustments
- src/renderer/components/SettingsPanel.tsx — a11y fix (native select/option)
- src/renderer/components/TemplateBrowser.tsx — styling adjustments
- src/renderer/components/TemplateCard.tsx — styling adjustments
- src/renderer/components/Toast.tsx — styling adjustments
- src/renderer/stores/app-store.ts — simplified state (no bubble)
- src/renderer/styles/globals.css — glass-card opaque, html/body/#root transparent
- src/shared/api-types.ts — bubble section removed
- src/shared/frameworks/karpathy.ts — updated messaging
- src/shared/types.ts — 19 IPC channels, StreamChunk removed

### New Files
- .prides/context/ — swarm context directory
- .prides/snapshots/ — swarm snapshots directory
- dev_notes/security-design.md — aspirational security doc (moved from SECURITY.md)

## Verification
- [ ] git status shows only intended files
- [ ] git diff shows no secrets or unintended changes
- [ ] pnpm typecheck passes
- [ ] pnpm lint passes
- [ ] pnpm test passes

## Commit Message
Use conventional commit: "release: v0.3.0 — bubble removal, lint fixes, GPU/transparency fixes"
