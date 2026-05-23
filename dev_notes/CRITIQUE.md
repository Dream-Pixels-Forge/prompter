# CRITIQUE — Prompter Codebase

> **Severity scale:** 🔴 Critical | 🟡 Moderate | 🔵 Minor
> **Goal:** Zero issues, zero warnings, zero vulnerabilities, maximum code quality.
> **Date:** 2026-05-24

---

## 🔴 CRITICAL

### C1. High-Severity CVEs in Electron (4 high, 11 moderate)

**Location:** `package.json:42` → `"electron": "^34.0.0"`

Electron 34.x ships 4 high-severity vulnerabilities (use-after-free in offscreen child windows, WebContents permission callbacks, PowerMonitor) and 11 moderate.

| Advisory | Patched |
|----------|---------|
| `GHSA-532v-xpq5-8h95` (UAF offscreen child window) | >=39.8.1 |
| `GHSA-8337-3p73-46f4` (UAF WebContents callbacks) | >=38.8.6 |
| (2 more high, 11 moderate) | >=38.8.6 |

Upgrade Electron to `^39.8.0` and validate transparent window behavior, IPC, and tray.

---

### C2. Unused Dependencies (`uuid` + `@types/uuid`)

**Location:** `package.json:33,40`

```json
"dependencies": { "uuid": "^10.0.0" },
"devDependencies": { "@types/uuid": "^10.0.0" }
```

Zero imports of `uuid` anywhere in source. Code uses `crypto.randomUUID()` natively. These are dead weight — remove them.

**Also unused:** Neither `uuid` nor `@types/uuid` appears in any `import` statement.

---

### C3. Type Escape — `catch (err: any)`

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

### C4. API Key Storage Falls Back to Plain Base64

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

### C5. Zero Test Coverage

**Location:** `package.json:18`

```json
"test": "echo 'No tests configured yet' && exit 0"
```

No test framework, no test files, no CI test enforcement. Every PR is merged without verification. The LLM providers (OpenAI, Anthropic, Ollama, Whisper), storage layer, intent parser, and all UI components are entirely untested.

**Minimal requirement:** Vitest + testing-library/react for component tests, and at minimum unit tests for the intent parser, framework detection, and storage service.

---

## 🟡 MODERATE

### M1. Weak CSP — Ollama Endpoint Whitelisted

**Location:** `index.html:6`

```html
connect-src 'self' http://localhost:11434;
```

The CSP allows plain HTTP connections to a local server. While intentional for Ollama, any XSS in the renderer can exfiltrate data to this endpoint. Should be hardened with a runtime nonce or hash-based approach where the user confirms the endpoint.

---

### M2. CSP Font Side-Channel Vector

**Location:** `index.html:9`

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:...">
```

Google Fonts CDN is whitelisted in CSP (`font-src 'self' https://fonts.gstatic.com`). Self-host the Inter font to eliminate the external dependency, reduce latency, and close the side-channel.

---

### M3. Hardcoded Anthropic API Version

**Location:** `src/main/llm/anthropic.ts:30`

```typescript
'anthropic-version': '2023-06-01',
```

This header pins to an old API version (2023). Current Anthropic API version is `2023-06-01` — actually this is still valid, but it should be a configurable constant, not hardcoded. Note that this version may be deprecated as Anthropic releases newer API versions.

---

### M4. No Debounced Search-as-You-Type in History

**Location:** `src/renderer/components/HistoryPanel.tsx:56,139`

```typescript
const handleSearch = () => load(query);
// ...
onKeyDown={e => e.key === 'Enter' && handleSearch()}
```

Search only triggers on Enter keypress. Modern UX expects debounced search-as-you-type (~300ms debounce). The current pattern requires an extra keystroke for every search.

---

### M5. Toast Can Appear Under Processing Overlay

**Location:** `Toast.tsx:27` vs `ProcessingOverlay.tsx:3`

Toast renders at `z-60` positioned absolute to the root, but `ProcessingOverlay` covers the card at `z-50` with `bg-[#1C1917]/70 backdrop-blur-sm`. When processing is active, the toast can render behind the opaque overlay, making it invisible.

---

### M6. Unused Export — `copyToClipboard` in llm.ts

**Location:** `src/renderer/lib/llm.ts:54`

```typescript
export async function copyToClipboard(text: string): Promise<boolean> {
  return window.api.clipboard.write(text);
}
```

Exported but never imported anywhere. Clipboard goes through `clipboard.ts` → `copyText()` instead. Dead code.

---

### M7. Release Pipeline Excessive Duplication (~300 lines)

**Location:** `.github/workflows/release.yml`

Four build jobs (mac-arm64, mac-x64, win-x64, linux-x64) are nearly identical copy-paste blocks. Use a build matrix strategy to reduce by ~70%.

---

### M8. No Linting Configuration

No ESLint, Prettier, or Biome config present. With 30+ TypeScript/React files, code style drift is inevitable. TypeScript catches type errors but not style, formatting, or import-ordering issues.

---

### M9. `catch` Silently Swallows Errors

**Location:** Multiple files — `src/renderer/lib/intent-parser.ts` (no try/catch needed), `src/renderer/components/HistoryPanel.tsx:47`:

```typescript
} catch {
  // offline fallback
}
```

Error is swallowed completely. No user feedback, no console log, no retry. Silent failures are the hardest to debug.

---

### M10. `env.d.ts` Declares Global `SpeechRecognition` Types but They're Never Loaded by tsconfig

**Location:** `src/renderer/env.d.ts`

The file declares `Window.SpeechRecognition` etc. but `tsconfig.json` only includes `src/**/*.ts` and `src/**/*.tsx`. The `.d.ts` extension **is** included, so this works. However, the declarations duplicate TypeScript's built-in `@types/dom-speech-recognition` — using the community types would be more maintainable.

---

## 🔵 MINOR

### m1. Shared Code Imports from Renderer

**Location:** `src/shared/frameworks.ts:2-6`

```typescript
import { openaiFramework } from '../renderer/lib/frameworks/openai';
import { anthropicFramework } from '../renderer/lib/frameworks/anthropic';
```

The `shared` directory is supposed to be framework-agnostic code shared between main and renderer. Importing from renderer into shared creates a **reverse dependency** that breaks the architectural layering. Move framework definitions to `shared/` or keep them in renderer and duplicate detection logic.

---

### m2. GSAP Reinflated Per-Component

GSAP is separately instantiated in `App.tsx`, `Bubble.tsx`, `BubbleExpanded.tsx`, `Toast.tsx` with identical `gsap.context()` patterns. Consider a shared `useGsapAnimation` hook.

---

### m3. `.npmrc` Uses Deprecated npm Config with pnpm

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

### m4. `detectFramework` Regex Flags Inconsistency

**Location:** `src/shared/frameworks.ts:22-26`

```typescript
if (/(video|film|animation|3d|motion|cinematic)/i.test(lower)) return 'mplct';
if (/(agent|assistant|tool|function|autonomous)/i.test(lower)) return 'karpathy';
```

First regex uses `/i` flag but `lower` is already `.toLowerCase()`. The `/i` flag is redundant on all of them. Inconsistent — `(lower)` + `/i` vs just `(lower)` is noisy.

---

### m5. `InputArea.tsx` Character Counter Lacks Proximity Warning

```typescript
<span className="text-[11px] text-white/25 font-mono">{input.length}/5000</span>
```

No color change or visual indicator when user approaches the 5000-char limit. Below 10% remaining (>4500), the counter should switch to amber/red.

---

### m6. `formatDate` in HistoryPanel Creates New `Date()` Objects Repeatedly

**Location:** `src/renderer/components/HistoryPanel.tsx:9-22`

Called once per history entry, each call creates up to 2 `new Date()` instances. Not a performance issue for 50 entries, but the function is impure and should accept `now` as a parameter for testability.

---

### m7. CI `security-scan` Job Runs `pnpm install` for Audit Only

**Location:** `.github/workflows/ci.yml:40-44`

The `security-scan` job installs all dependencies just to run `pnpm audit`. This duplicates the `quality` job's install. Could be merged into a single job or use `--offline` audit from the `quality` job's installed dependencies.

---

### m8. `pnpm-workspace.yaml` Is a Single-Project Workspace

The file exists but this project has no workspace packages. The config only allows builds for `electron` and `esbuild`. This is valid but unnecessary overhead — remove unless multi-package workspace is planned.

---

### m9. No `AGENTS.md` or `CLAUDE.md` for AI Tooling

No agentic coding guidelines file exists. Given the heavy use of AI-assisted development (evidenced by PRIDES.md, agent references, and commit messages), a project-level guidelines file would improve consistency across sessions.

---

### m10. `buildSectionContent` Has an Unused `_label` Parameter

**Location:** `src/main/llm/orchestrator.ts:93`

```typescript
function buildSectionContent(key: string, _label: string, input: string, ...): string {
```

The `_label` parameter is never used in the function body. The underscore prefix correctly signals intent to TS, but it should be removed entirely.

---

## SUMMARY

| Severity | Count |
|----------|-------|
| 🔴 Critical | 5 |
| 🟡 Moderate | 10 |
| 🔵 Minor | 10 |
| **Total** | **25** |

### Top 5 Actions (Highest ROI)

1. **Upgrade Electron** (🔴 C1) — Fix all 4 high + 11 moderate CVEs in one change
2. **Remove unused `uuid` dependencies** (🔴 C2) — Clean up package.json
3. **Fix `err: any` type escape** (🔴 C3) — One-line fix for type safety
4. **Harden API key storage** (🔴 C4) — Fail closed instead of base64 encoding
5. **Add test infrastructure** (🔴 C5) — Vitest + basic unit tests for business logic

> *"Would a senior engineer say this is overcomplicated? If yes, simplify."*
> The codebase is well-structured, clean, and follows good patterns overall.
> The issues are concentrated in security, testing, and configuration — not architecture.
