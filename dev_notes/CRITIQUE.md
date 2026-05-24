# CRITIQUE — Prompter Codebase

> **Severity scale:** 🔴 Critical | 🟡 Moderate | 🔵 Minor
> **Goal:** Zero issues, zero warnings, zero vulnerabilities, maximum code quality.
> **Date:** 2026-05-24
> **Verdict legend:** [✅ Agreed] [⚠️ Debatable — low impact for local app] [❌ Retracted]

---

## 🔴 CRITICAL

### C1. High-Severity CVEs in Electron (4 high, 11 moderate) [✅ Agreed]

**Location:** `package.json:42` → `"electron": "^34.0.0"`

Electron 34.x ships 4 high-severity vulnerabilities (use-after-free in offscreen child windows, WebContents permission callbacks, PowerMonitor) and 11 moderate.

| Advisory | Patched |
|----------|---------|
| `GHSA-532v-xpq5-8h95` (UAF offscreen child window) | >=39.8.1 |
| `GHSA-8337-3p73-46f4` (UAF WebContents callbacks) | >=38.8.6 |
| (2 more high, 11 moderate) | >=38.8.6 |

Upgrade Electron to `^39.8.0` and validate transparent window behavior, IPC, and tray.

---

### C2. Unused Dependencies (`uuid` + `@types/uuid`) [✅ Agreed]

**Location:** `package.json:33,40`

```json
"dependencies": { "uuid": "^10.0.0" },
"devDependencies": { "@types/uuid": "^10.0.0" }
```

Zero imports of `uuid` anywhere in source. Code uses `crypto.randomUUID()` natively. These are dead weight — remove them.

**Also unused:** Neither `uuid` nor `@types/uuid` appears in any `import` statement.

---

### C3. Type Escape — `catch (err: any)` [✅ Agreed]

**Location:** `src/renderer/components/InputArea.tsx:79`

```typescript
} catch (err: any) {
  setError(err?.message || 'Generation failed');
```

The `any` type bypass defeats TypeScript strict mode. Use `unknown` + proper narrowing:

```typescript
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Generation failed';
  setError(message);
  showToast(message);
```

---

### C4. API Key Storage Falls Back to Plain Base64 [✅ Agreed]

**Location:** `src/main/storage.ts:97-103`

```typescript
if (safeStorage.isEncryptionAvailable()) {
  const encrypted = safeStorage.encryptString(apiKey);
  keys[service] = encrypted.toString('base64');
} else {
  // Fallback: base64 encode (not truly secure, but avoids plaintext on disk)
  keys[service] = Buffer.from(apiKey, 'utf-8').toString('base64');
}
```

Base64 is **encoding, not encryption**. A user with filesystem access trivially decodes API keys. On systems where `safeStorage` is unavailable (headless Linux, containers), keys are stored in plaintext-equivalent.

**Fix:** Fail closed with a descriptive error when `safeStorage.isEncryptionAvailable()` is false, or implement a machine-level derived key for fallback encryption. Never store API keys in reversible encoding.

---

### C5. Zero Test Coverage [✅ Agreed]

**Location:** `package.json:18`

```json
"test": "echo 'No tests configured yet' && exit 0"
```

No test framework, no test files, no CI test enforcement. Every PR is merged without verification. The LLM providers (OpenAI, Anthropic, Ollama, Whisper), storage layer, intent parser, and all UI components are entirely untested.

**Minimal requirement:** Vitest + testing-library/react for component tests, and at minimum unit tests for the intent parser, framework detection, and storage service.

---

### C6. `insertHistory` Error Silently Swallowed [✅ Agreed]

**Location:** `src/renderer/components/InputArea.tsx:78`

```typescript
insertHistory({...}).catch(() => {});
```

History insertion failures are silently discarded. If storage fails (disk full, permissions, corrupt file), the user never knows. At minimum log the error:
```typescript
insertHistory({...}).catch(err => console.error('[History] insert failed:', err));
```

---

## 🟡 MODERATE

### M1. Weak CSP — Ollama Endpoint Whitelisted [⚠️ Debatable]

**Location:** `index.html:6`

```html
connect-src 'self' http://localhost:11434;
```

The CSP allows plain HTTP connections to a local server. Already tightened from `http://localhost:*` to port 11434. Acceptable for a local dev tool — the XSS+exfiltration scenario requires the attacker to already have renderer code execution, at which point CSP is a defense-in-depth layer, not a primary control. Low practical risk.

---

### M2. CSP Font Side-Channel Vector [✅ Agreed]

**Location:** `index.html:9`

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:...">
```

Google Fonts CDN is whitelisted in CSP (`font-src 'self' https://fonts.gstatic.com`). Self-host the Inter font to eliminate the external dependency, reduce latency, and close the side-channel. Low practical risk for a local app, but self-hosting is trivial and removes a dependency.

---

### M3. Hardcoded Anthropic API Version [⚠️ Debatable]

**Location:** `src/main/llm/anthropic.ts:30`

```typescript
'anthropic-version': '2023-06-01',
```

`2023-06-01` is still the current Anthropic API version. Making it a constant is cleanup, not a bug. Low urgency — if Anthropic ever deprecates this version, it'll break regardless of being hardcoded or constant.

---

### M4. No Debounced Search-as-You-Type in History [✅ Agreed]

**Location:** `src/renderer/components/HistoryPanel.tsx:56,139`

```typescript
const handleSearch = () => load(query);
// ...
onKeyDown={e => e.key === 'Enter' && handleSearch()}
```

Search only triggers on Enter keypress. Modern UX expects debounced search-as-you-type (~300ms debounce). The current pattern requires an extra keystroke for every search.

---

### M5. Toast Can Appear Under Processing Overlay [⚠️ Debatable]

**Location:** `Toast.tsx:27` vs `ProcessingOverlay.tsx:3`

Toast renders at `fixed z-60`, overlay at `absolute z-50`. Toast is fixed to viewport — it renders correctly above the overlay. Stacking is correct in practice.

---

### M6. Multiple Dead Exports (8 symbols) [✅ Agreed]

**Locations:** Across `storage.ts`, `overlay.ts`, `llm.ts`, `stt.ts`, `templates/index.ts`, `whisper.ts`, `openai.ts`

These symbols are defined, exported, but imported **nowhere** in the codebase:

| Symbol | File | Type |
|--------|------|------|
| `getAllHistory()` | `src/main/storage.ts:84` | Method |
| `getAllApiKeys()` | `src/main/storage.ts:125` | Method |
| `getDefaultPosition()` | `src/main/overlay.ts:15` | Function |
| `getTemplatesByFramework()` | `src/renderer/lib/templates/index.ts:34` | Function |
| `copyToClipboard()` | `src/renderer/lib/llm.ts:54` | Function |
| `WHISPER_DEFAULT_MODEL` | `src/main/stt/whisper.ts:2` | Constant (not used even internally) |
| `isSpeechSupported()` | `src/renderer/lib/stt.ts:97` | Function |
| `OPENAI_DEFAULT_MODEL` | `src/main/llm/openai.ts:4` | Constant |

Each adds noise, suggests API surface area that doesn't exist, and hurts maintainability. Remove or add consumers.

---

### M7. Release Pipeline Excessive Duplication (~300 lines) [✅ Agreed]

**Location:** `.github/workflows/release.yml`

Four build jobs (mac-arm64, mac-x64, win-x64, linux-x64) are nearly identical copy-paste blocks. Use a build matrix strategy to reduce by ~70%.

---

### M8. Broken Biome Linting Configuration (137 errors) [✅ Agreed]

**Location:** `biome.json` + `package.json:45` — Biome is pinned implicitly by version mismatch

A `biome.json` exists targeting v1.9.4 schema, but the project has no `biome` devDependency and `npx` resolves to v2.4.15 which rejects the schema:
```
schema version 1.9.4 does not match CLI version 2.4.15
Found an unknown key `organizeImports`  (removed in Biome v2)
```

Running `npx @biomejs/biome@1.9.4 check src/` reveals **137 errors**:

| Category | Count | Fixable |
|----------|-------|---------|
| Formatting differences | ~125 | Yes |
| `style/useImportType` | ~7 | Yes |
| `style/useNodejsImportProtocol` | 3 | Yes |
| `style/noUnusedTemplateLiteral` | 2 | Yes |
| `style/noCommaOperator` | 2 | Yes |
| `style/noNonNullAssertion` | 1 | Yes |
| `complexity/useOptionalChain` | 1 | Yes |

Additionally, there's no linting script in `package.json`, so no CI job runs it. Fixes:
- Add `"biome": "^1.9.4"` to devDependencies (pinned version)
- Fix config schema or migrate to v2
- Add `"lint": "biome check src/"` and `"lint:fix": "biome check --apply src/"` scripts
- Run in CI alongside typecheck

---

### M9. Silent Catch Blocks Mask Failures [✅ Agreed]

**Locations:** `src/renderer/components/HistoryPanel.tsx:47`, `src/renderer/components/InputArea.tsx:78`, `src/main/storage.ts:24`

Three patterns of error swallowing:

**a) HistoryPanel empty catch:**
```typescript
} catch {
  // offline fallback
}
```
No logging, no user feedback, no toast. If the IPC handler throws, the user just sees an empty list.

**b) InputArea `insertHistory` catch:**
```typescript
}).catch(() => {});
```
Critical persistence failure silently discarded. User thinks history was saved but it wasn't.

**c) StorageService write queue swallows errors:**
```typescript
this.writeQueue = this.writeQueue.then(fn, fn);
```
The second `fn` in `.then(fn, fn)` IS the rejection handler — it calls the same function which catches errors internally — but the error path depends entirely on the function remembering to catch. Any uncaught error in a write silently terminates the chain.

**Fix:** At minimum log errors. For user-facing operations (history insert), toast the failure.

---

### M10. `env.d.ts` Declares Global `SpeechRecognition` Types [⚠️ Debatable]

**Location:** `src/renderer/env.d.ts`

The file re-declares the entire `SpeechRecognition` API as global types. Even if technically redundant with DOM lib, it explicitly types an experimental browser API that TypeScript's DOM declarations may lag behind on. Harmless documentation — removing it saves nothing and risks losing clarity on what APIs the app expects.

---

### M11. No `node:` Protocol on Node.js Builtin Imports [✅ Agreed]

**Locations:** `src/main/*.ts` — 3 occurrences

```typescript
import path from 'path';              // should be import path from 'node:path'
import * as fs from 'fs';              // should be import * as fs from 'node:fs'
require('fs')                          // should be require('node:fs')
```

Using bare module names for Node.js builtins is a historical practice. The `node:` prefix is explicit, avoids ambiguity, and is enforced by Biome.

---

### M12. Inconsistent `import type` Syntax (7 occurrences) [✅ Agreed]

**Locations:** All LLM provider files + shared types

Mixed use of inline `type` keyword (should be `import type`):
```typescript
import { type OllamaStatus } from '../shared/types';   // inline — inconsistent
import type { OllamaStatus } from '../shared/types';    // import-type — preferred
```

The inline form leaves the import in the runtime module graph even though only types are used. Biome flags all 7 occurrences as `useImportType`.

---

### M13. `HistoryPanel.tsx` Load Effect Has Stale Closure on `isMounted` Ref [✅ Agreed]

**Location:** `src/renderer/components/HistoryPanel.tsx:33-51`

```typescript
const isMounted = useRef(true);
useEffect(() => { return () => { isMounted.current = false; }; }, []);
// ...
const load = useCallback(async (q?: string) => {
  // ...
  if (isMounted.current) setEntries(data);
}, []);
```

The `isMounted` pattern is an anti-pattern in React 18+. With Strict Mode, effects run twice in development. React 18+ already handles unmounted-component state updates gracefully. The ref adds complexity for no benefit — remove the `isMounted` guard and handle cancellation via AbortController instead.

---

### M14. Bubble Position Not Persisted Across App Restarts [✅ Agreed]

**Location:** `src/renderer/hooks/useBubblePosition.ts:70`

Position is saved to `localStorage` (per-origin browser storage). In an Electron app, this means the position resets if the renderer context is destroyed (e.g., on `app.quit()` vs `BrowserWindow.close()`). Use `electron-store` or `settings.get/set` IPC to persist position durably.

---

## 🔵 MINOR

### m1. Migrated Framework Files Left Orphaned in Renderer [✅ Agreed]

**Location:** `src/renderer/lib/frameworks/`

The `src/shared/frameworks/` directory has all 5 framework definitions. `src/renderer/lib/frameworks/` has only `index.ts` which re-exports from shared. The renderer directory is vestigial — it's 1 file that just re-exports. Either remove the renderer wrapper and have consumers import directly from `@/shared/frameworks`, or keep it for backward compat.

---

### m2. GSAP Reinflated Per-Component [⚠️ Debatable]

GSAP is separately instantiated in `App.tsx`, `Bubble.tsx`, `BubbleExpanded.tsx`, `Toast.tsx` with identical `gsap.context()` patterns. Components have different animation needs — a shared hook isn't obviously better. Not worth abstracting unless the pattern repeats to 6+ instances.

---

### m3. `.npmrc` Uses Deprecated npm Config with pnpm [✅ Agreed]

**Location:** `.npmrc:4-5`

```ini
auto-install-peers=true
shamefully-hoist=true
```

These are npm-config flags. pnpm ignores those and uses `pnpm-workspace.yaml` + `.npmrc` pnpm-specific options. The `shamefully-hoist` in particular has no effect with pnpm. `pnpm audit` output already shows:

```
Unknown project config "auto-install-peers"
Unknown project config "shamefully-hoist"
```

---

### m4. `detectFramework` Regex Flags Inconsistency [⚠️ Debatable]

**Location:** `src/shared/frameworks.ts:22-26`

```typescript
if (/(video|film|animation|3d|motion|cinematic)/i.test(lower)) return 'mplct';
if (/(agent|assistant|tool|function|autonomous)/i.test(lower)) return 'karpathy';
```

`.toLowerCase()` + `/i` is redundant but harmless. Pure cosmetic.

---

### m5. `InputArea.tsx` Character Counter Lacks Proximity Warning [⚠️ Debatable]

```typescript
<span className="text-[11px] text-white/25 font-mono">{input.length}/5000</span>
```

No color change or visual indicator when user approaches the 5000-char limit. Valid UX suggestion, but not a code quality issue.

---

### m6. `formatDate` in HistoryPanel Creates New `Date()` Objects Repeatedly [⚠️ Debatable]

**Location:** `src/renderer/components/HistoryPanel.tsx:9-22`

Called once per history entry, each call creates up to 2 `new Date()` instances. Not a performance issue for 50 entries. Critique itself notes this isn't a real problem.

---

### m7. CI `security-scan` Job Runs `pnpm install` for Audit Only [✅ Agreed]

**Location:** `.github/workflows/ci.yml:40-44`

The `security-scan` job installs all dependencies just to run `pnpm audit`. This duplicates the `quality` job's install. Could be merged into a single job or use `--offline` audit from the `quality` job's installed dependencies.

---

### m8. `pnpm-workspace.yaml` Is a Single-Project Workspace [⚠️ Debatable]

The file exists but this project has no workspace packages. The config only allows builds for `electron` and `esbuild`. This is valid but unnecessary overhead — doesn't hurt anything. Trivial.

---

### m9. No `AGENTS.md` or `CLAUDE.md` for AI Tooling [⚠️ Debatable]

No agentic coding guidelines file exists. Given the heavy use of AI-assisted development (evidenced by PRIDES.md, agent references, and commit messages), a project-level guidelines file would improve consistency across sessions. But this is opinion-based — not every project needs one. Global config at `~/.config/opencode/AGENTS.md` partially covers this.

---

### m10. `buildSectionContent` Has an Unused `_label` Parameter [✅ Agreed]

**Location:** `src/main/llm/orchestrator.ts:93`

```typescript
function buildSectionContent(key: string, _label: string, input: string, ...): string {
```

The `_label` parameter is never used in the function body. The underscore prefix correctly signals intent to TS, but it should be removed entirely.

---

### m11. Release Pipeline SHA Generation Inconsistency (macOS vs Linux) [❌ Retracted]

**Location:** `.github/workflows/release.yml:124`

Incorrect. Both macOS and Linux use `${{ matrix.checksum }} "$f" > "$f.sha256"` with `>` (overwrite), not `>>` (append). The code is already correct. This finding is wrong.

---

### m12. `parseLLMOutput` Regex Is Brittle — No Escape for Special Regex Chars in Section Keys [✅ Agreed]

**Location:** `src/main/llm/orchestrator.ts:77-90`

```typescript
const regex = new RegExp(`#{1,3}\\s+${lookup}[\\s\\S]*?(?=#{1,3}\\s+|$)`, 'i');
```

If a framework section key contained characters special to regex (e.g., `[status]`, `(output)`), this would silently fail or match incorrectly. Section keys are currently safe (lowercase camelCase), but this is a fragility that future changes could trigger. Use `escapeRegex()` on the lookup value.

---

### m13. `Process.env.NODE_ENV` Used in Renderer Without Define Plugin Config [✅ Agreed]

**Location:** `src/renderer/components/TemplateBrowser.tsx:46`

```typescript
if (process.env.NODE_ENV === 'development') {
```

This works because `vite-plugin-electron-renderer` shims Node.js globals, but it's fragile. Vite's recommended pattern is `import.meta.env.DEV`. If the renderer plugin configuration changes, this will throw at runtime (`process is not defined`).

---

### m14. React StrictMode Compatibility — `useEffect` Cleanup Race in BubbleExpanded [✅ Agreed]

**Location:** `src/renderer/components/BubbleExpanded.tsx:36-55`

GSAP context is created inside `useEffect` with `gsap.context()`. In React StrictMode (development), effects run twice (mount → unmount → mount). The `ctx.revert()` cleanup runs between the two mounts. This is correct, but the entrance animation will play twice in development, which can mask animation bugs that only appear in production (single mount). Test without StrictMode before shipping.

---

### m15. `useBubblePosition` Does Not Handle Touch Events for Dragging [✅ Agreed]

**Location:** `src/renderer/hooks/useBubblePosition.ts:50-83`

Only `mousedown`/`mousemove`/`mouseup` events are tracked. Touch devices (Surface, iPad with Sidecar, touchscreen monitors) cannot drag the bubble. Add `touchstart`/`touchmove`/`touchend` handlers.

---

## APPENDIX: Findings from REVIEW_AUDIT.md Not in Original CRITIQUE

The REVIEW_AUDIT cross-check caught 6 issues my initial Round 1 missed. Current status verified against HEAD (develop @ c5bcc49):

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| #50 | OutputPanel: `useEffect` after conditional early return (rules-of-hooks) | 🟡 | **Fixed** — useEffect moved before return |
| #51 | PromptSection: missing `setTimeout` cleanup on copy feedback | 🔵 | **Fixed** — `timerRef` with cleanup present |
| #52 | HistoryPanel: no unmount guard on async `load()` | 🔵 | Still present — overlaps with M13 above |
| #53 | whisper.ts: `body as any` escape — claimed fixed but NOT | 🔵 | **Fixed** — cast removed |
| #54 | Dead stream functions — claimed fixed but NOT | 🔵 | Partial — stream functions removed, `StreamChunk` interface still on `types.ts:90` (unused) |
| #55 | Bubble.tsx: missing `aria-label` — claimed fixed but NOT | 🔵 | **Fixed** — `aria-label="Open Prompter"` present |
| #56 | TemplateBrowser: `console.warn` on every render | 🔵 | **Fixed** — wrapped in `useEffect` |

**Takeaway:** The REVIEW_AUDIT was conducted before the most recent fix pass. 5 of 6 findings are already resolved. Only #52 (same as M13) and the leftover `StreamChunk` interface remain.

---

## VERDICT SUMMARY

| Category | Count |
|----------|-------|
| ✅ Agreed | 25 |
| ⚠️ Debatable (low impact for local app) | 9 |
| ❌ Retracted (factually wrong) | 1 |
| **Total original findings** | **35** |
| Missed in original, from REVIEW_AUDIT | 6 (5 now fixed) |

### Breakdown

**Agreed (25):** C1–C6, M4, M6–M9, M11–M14, m1, m3, m7, m10, m12–m15 — all valid. Electron upgrade, silent catches, dead exports, broken Biome, no tests, missing `node:` prefix, brittle regex, touch events, etc.

**Debatable (9):** M1 (CSP already port-tightened), M2 (side-channel risk near-zero for local app), M3 (version still current), M5 (z-index stacking correct), M10 (harmless docs), m2 (components differ), m4 (cosmetic), m5 (UX suggestion, not code quality), m6 (not a real perf issue), m8 (trivial), m9 (opinion-based).

**Retracted (1):** m11 — SHA generation uses `>` consistently. The code is correct.

---

### Top 7 Actions (Highest ROI)

1. **Upgrade Electron** (🔴 C1) — Fix all 4 high + 11 moderate CVEs in one change
2. **Remove unused `uuid` dependencies** (🔴 C2) — Clean up package.json
3. **Fix `err: any` type escape** (🔴 C3) — One-line fix for type safety
4. **Harden API key storage** (🔴 C4) — Fail closed instead of base64 encoding
5. **Add test infrastructure** (🔴 C5) — Vitest + basic unit tests for business logic
6. **Fix Biome config + run linter** (🟡 M8) — 137 errors, mostly auto-fixable
7. **Remove 8 dead exports** (🟡 M6) — Reduce noise and maintenance surface

> The codebase is well-structured, clean, and follows good patterns overall.
> The issues are concentrated in security, testing, and configuration — not architecture.
> 34/35 findings directionally correct; only m11 is factually wrong.
> The "debatable" 9 are real concerns but carry low practical impact for a local Electron app.
