# Task: Fix Biome Lint Errors

## Current State
After running `pnpm lint` (Biome 1.9.4), there are 13 errors:

### Real Issues (3):
1. **Unused variable** — `src/renderer/components/MicButton.tsx:15:10` — `interimText` is declared but never read. Fix: either use it OR prefix with underscore (`_interimText`) since setInterimText IS used.
2. **A11y: useSemanticElements** — `src/renderer/components/SettingsPanel.tsx:82-83` — role="listbox" should be `<select>` element
3. **A11y: useSemanticElements** — `src/renderer/components/SettingsPanel.tsx:92-93` — role="option" should be `<option>` element

### Formatting Only (10):
- `src/shared/frameworks/karpathy.ts` — single→double quotes
- `src/renderer/components/OutputPanel.tsx` — `<button type="button">` multi-line pattern
- `src/renderer/components/MicButton.tsx` — `<button type="button">` multi-line pattern + `<Mic className>` multi-line
- `src/renderer/components/PromptSection.tsx` — `<button type="button">` multi-line
- `src/renderer/components/HistoryPanel.tsx` — multiple `<button type="button">` multi-line
- `src/renderer/components/TemplateCard.tsx` — `<button type="button">` multi-line
- `src/renderer/components/TemplateBrowser.tsx` — organize imports (ChefHat/CheckSquare order) + `<button>` + array formatting
- `src/renderer/components/SettingsPanel.tsx` — `<button type="button">` multi-line + general formatting
- `src/renderer/components/InputArea.tsx` — multiple `<button type="button">` + multi-line JSX formatting

## Instructions
Fix ALL 13 errors. Approach:
- Run `npx @biomejs/biome@1.9.4 check --write --unsafe src/` to auto-fix formatting + unused variable
- Then manually verify the SettingsPanel.tsx a11y issues are resolved (they may need manual fix since Biome suggests `<select>`/`<option>`)
- If the auto-fix renamed `interimText` to `_interimText`, confirm the pattern is correct (the function `setInterimText` is still called)

## Verification
Run `pnpm lint` and confirm 0 errors.
Run `pnpm typecheck` to confirm no type breakage.
Run `pnpm test` to confirm all tests pass.
