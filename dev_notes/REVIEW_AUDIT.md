# Review Audit — ISSUES_FIXED.md Cross-Check + CRITIQUE.md Review

Full source code audit conducted 2026-05-24. Every fix claimed in `ISSUES_FIXED.md` verified against actual current source code. Plus all 25 items in `CRITIQUE.md` cross-checked and triaged.

---

## Part 1: ISSUES_FIXED.md Cross-Check

### Summary

| Category | Count |
|----------|-------|
| Fixes correctly implemented | 29 of 32 |
| Fixes claimed but NOT implemented | 3 |
| New issues created from deep-dive findings | 7 |

### ✅ Correctly Implemented (29)

#### Critical (4)
| # | Claimed Fix | Verified At | Status |
|---|-------------|-------------|--------|
| #17 | Stale closure in bubble drag — `positionRef` synced via `useEffect` | `useBubblePosition.ts:48-49` | ✅ |
| #18 | Main process imports renderer code — moved to `shared/frameworks.ts` | `orchestrator.ts:4` imports from shared | ✅ |
| #19 | `any` types in preload — typed from `shared/types` | `preload/index.ts` | ✅ |
| #20 | `(settings as any)` cast — direct property access | `ipc.ts:95` | ✅ |

#### High (6)
| # | Claimed Fix | Verified At | Status |
|---|-------------|-------------|--------|
| #21 | Dead FrameworkSelector.tsx — deleted | File not found | ✅ |
| #22 | Unused `history` field in prompt-store — removed | `prompt-store.ts` | ✅ |
| #23 | No debounce — 300ms debounce added | `InputArea.tsx:23-34` | ✅ |
| #24 | Missing IPC validation — `validateId/Service/TextLength` | `ipc.ts:18-35` | ✅ |
| #25 | Web Speech types inline — moved to `env.d.ts` | `env.d.ts` exists + `stt.ts` clean | ✅ |
| #26 | Race on history inserts — `writeQueue` promise-chain | `storage.ts:14,23-25` | ✅ |

#### Medium (5)
| # | Claimed Fix | Verified At | Status |
|---|-------------|-------------|--------|
| #28 | Fragile settings serialization — explicit pick | `settings-store.ts:57-67` | ✅ |
| #29 | `sandbox: false` → `sandbox: true` | `main.ts:34` | ✅ |
| #30 | Backdrop exit animation — GSAP exit | `App.tsx:52-58` | ✅ |
| #32 | CSP `connect-src` wildcard — scoped to `localhost:11434` | `index.html:6` | ✅ |
| #33 | API keys in main process memory — reads from storage on demand | `ipc.ts:95` | ✅ |

#### Low (9)
| # | Claimed Fix | Verified At | Status |
|---|-------------|-------------|--------|
| #34 | Unused IPC channels — removed constants | `types.ts` — no STORE_GET/STORE_SET/STREAM | ✅ |
| #35 | Framework color mapping — `color` field on Framework interface | `types.ts:36`, `FrameworkBadge.tsx:14` | ✅ |
| #36 | Model lists duplicated — shared from `types.ts` | `types.ts:141-147`, `SettingsPanel.tsx:5` | ✅ |
| #37 | aria-labels on icon-only buttons (most) | OutputPanel copy/clear, HistoryPanel delete, TemplateCard select, BubbleExpanded close | ✅ |
| #38 | No keyboard focus management — auto-focus on mount | `InputArea.tsx:36-38` | ✅ |
| #39 | Hardcoded `buildSectionContent` — data-driven via `defaultContent` | `orchestrator.ts:93-101` | ✅ |
| #40 | AbortController duplication — `fetch-with-timeout.ts` | File exists + used by all 3 providers | ✅ |
| #41 | Inter font not loaded — Google Fonts link | `index.html:9` | ✅ |
| #42 | `parseLLMOutput` regex fragile — fuzzy key generation | `orchestrator.ts:76-91` | ✅ |

#### Third Pass (8)
| # | Claimed Fix | Verified At | Status |
|---|-------------|-------------|--------|
| #43 | Error-clearing effect cancels errors — split into two effects | `InputArea.tsx:46-48` (separate `[input]` effect) | ✅ |
| #44 | Missing setTimeout cleanup — `copiedTimerRef` + cleanup | `OutputPanel.tsx:14,20-22,29-30` | ✅ |
| #45 | Non-null assertion crash — `?? PROVIDERS[0]` fallback | `SettingsPanel.tsx:94` | ✅ |
| #47 | `asarUnpack` references `public/` — removed | `electron-builder.yml:28-30` (only `**/*.node`) | ✅ |
| #49 | ARCHITECTURE.md stale refs — updated | All file references match actual structure | ✅ |
| #31 (revisit) | SQLite mentioned in docs — replaced with JSON storage | `ARCHITECTURE.md:18,237-256` | ✅ |
| Backdrop animation | Always-mount backdrop + GSAP control | `App.tsx:74-78` | ✅ |
| `checkOllamaStatus` | Missing timeout — `fetchWithTimeout` 5s | `ollama.ts:40-43` | ✅ |
| `(window as any)` in `stt.ts` | Window interface augmented in `env.d.ts` | `stt.ts:19-20`, `env.d.ts:33-35` | ✅ |

### ❌ NOT Implemented (3 — claimed fixed but code unchanged)

| # | Claim | Actual |
|---|-------|--------|
| #53 | `whisper.ts:36` — `body as any` removed | `body: body as any,` **unchanged** |
| #54 | Dead stream functions removed | `streamOpenAI`, `streamAnthropic`, `streamOllama`, `StreamChunk` **still present** |
| #55 | `Bubble.tsx` — `aria-label="Open Prompter"` added | Button at line 42 has **no aria-label** |

### 🆕 Findings from Deep Dive (issues created)

| # | Description | Severity | File |
|---|-------------|----------|------|
| #50 | `useEffect` after conditional early return (rules-of-hooks violation) | Medium | `OutputPanel.tsx:16-22` |
| #51 | Missing `setTimeout` cleanup on copy feedback (same pattern as #44) | Low | `PromptSection.tsx:17` |
| #52 | No unmount guard on async `load()` — sets state after unmount | Low | `HistoryPanel.tsx:47` |
| #56 | `console.warn` runs on every render (not in `useEffect`) | Low | `TemplateBrowser.tsx:46-52` |

---

## Part 2: CRITIQUE.md Review

All 25 items from `dev_notes/CRITIQUE.md` cross-checked against current code. 15 created as new issues, 10 skipped (already mitigated, intentional tradeoffs, or too minor).

### 🔴 Critical (5) — 4 created

| ID | Title | Code Verification | Issue | Status |
|----|-------|-------------------|-------|--------|
| C1 | Electron ^34.x has 4 high + 11 moderate CVEs | `package.json:42` — still `^34.0.0` | **#57** | Open |
| C2 | Unused `uuid` + `@types/uuid` dependencies | `package.json:33,40` — still present | **#63** | Open |
| C3 | `catch (err: any)` type escape in InputArea | `InputArea.tsx:79` — still `catch (err: any)` | **#58** | Open |
| C4 | API key base64 fallback when safeStorage unavailable | `storage.ts:97-103` — base64 fallback still present | **#59** | Open |
| C5 | Zero test coverage | `package.json:18` — already tracked as #27 | #27 | Kept open |

### 🟡 Moderate (10) — 6 created, 2 skipped, 2 overlap

| ID | Title | Code Verification | Issue | Status |
|----|-------|-------------------|-------|--------|
| M1 | CSP Ollama endpoint whitelisted | Intentional tradeoff — already tightened from `http://localhost:*` to port 11434 | — | Skipped |
| M2 | Self-host Inter font vs Google Fonts CDN | `index.html:9` — still loading from Google Fonts | **#60** | Open |
| M3 | Hardcoded Anthropic API version | `anthropic.ts:30` — still `'2023-06-01'` literal | **#61** | Open |
| M4 | History search should use debounced search-as-you-type | `HistoryPanel.tsx:132` — still on Enter keypress only | **#62** | Open |
| M5 | Toast renders under Processing Overlay | Toast: `fixed z-60`, Overlay: `absolute z-50` inside card. Toast is fixed to viewport, renders correctly above | — | Skipped |
| M6 | Unused export `copyToClipboard` in llm.ts | `llm.ts:54-56` — still exported, never imported | **#64** | Open |
| M7 | Release pipeline 4 jobs duplicated ~300 lines | `.github/workflows/release.yml` — still copy-pasted | **#65** | Open |
| M8 | No linting configuration (ESLint/Prettier/Biome) | No config file exists | **#66** | Open |
| M9 | Silent catch swallows errors (HistoryPanel + elsewhere) | `HistoryPanel.tsx:40-42` — `catch { // offline fallback }` | **#67** | Open |
| M10 | `env.d.ts` SpeechRecognition types redundant with `@types/dom-speech-recognition` | Works fine, minor maintenance concern | — | Skipped |

### 🔵 Minor (10) — 5 created, 5 skipped

| ID | Title | Code Verification | Issue | Status |
|----|-------|-------------------|-------|--------|
| m1 | `shared/frameworks.ts` imports from `renderer/` (reverse dependency) | `shared/frameworks.ts:2-6` — still imports from renderer | **#68** | Open |
| m2 | GSAP reinflated per-component → shared hook | Works fine, reasonable pattern | — | Skipped |
| m3 | `.npmrc` uses npm-only config flags ignored by pnpm | `.npmrc:4-5` — `auto-install-peers` + `shamefully-hoist` still present | **#69** | Open |
| m4 | `detectFramework` regex `/i` flag redundant with `.toLowerCase()` | `shared/frameworks.ts:22-26` — cosmetic | — | Skipped |
| m5 | Character counter lacks proximity warning near 5000 limit | `InputArea.tsx` — cosmetic UX | — | Skipped |
| m6 | `formatDate` creates `new Date()` repeatedly (impure) | `HistoryPanel.tsx:9-22` — not a real issue | — | Skipped |
| m7 | CI security-scan job duplicates `pnpm install` | `.github/workflows/ci.yml` | **#70** | Open |
| m8 | `pnpm-workspace.yaml` single-project workspace | Valid config, unnecessary overhead | — | Skipped |
| m9 | No project-level AGENTS.md | User has global config at `~/.config/opencode/AGENTS.md` | — | Skipped |
| m10 | Unused `_label` parameter in `buildSectionContent` | `orchestrator.ts:93` — still present | **#71** | Open |

---

## All Open Issues

| # | Title | Source | Severity |
|---|-------|--------|----------|
| #27 | Zero test coverage | Critique C5 | 🔴 |
| #50 | OutputPanel rules-of-hooks violation | Deep dive | 🟡 |
| #51 | PromptSection missing setTimeout cleanup | Deep dive | 🔵 |
| #52 | HistoryPanel unmount guard | Deep dive | 🔵 |
| #53 | whisper.ts body as any (ISSUES_FIXED.md un-fixed) | ISSUES_FIXED review | 🔵 |
| #54 | Dead stream functions (ISSUES_FIXED.md un-fixed) | ISSUES_FIXED review | 🔵 |
| #55 | Bubble.tsx missing aria-label (ISSUES_FIXED.md un-fixed) | ISSUES_FIXED review | 🔵 |
| #56 | TemplateBrowser console.warn on every render | Deep dive | 🔵 |
| #57 | Upgrade Electron ^34.x to ^39.x (CVEs) | Critique C1 | 🔴 |
| #58 | catch (err: any) type escape in InputArea | Critique C3 | 🔴 |
| #59 | API key base64 fallback (fail closed instead) | Critique C4 | 🔴 |
| #60 | Self-host Inter font instead of Google Fonts CDN | Critique M2 | 🟡 |
| #61 | Extract hardcoded Anthropic API version to constant | Critique M3 | 🟡 |
| #62 | Debounced search-as-you-type in History | Critique M4 | 🟡 |
| #63 | Remove unused uuid + @types/uuid dependencies | Critique C2 | 🔴 |
| #64 | Remove unused export copyToClipboard in llm.ts | Critique M6 | 🔵 |
| #65 | Release pipeline matrix strategy | Critique M7 | 🟡 |
| #66 | Add linting configuration | Critique M8 | 🟡 |
| #67 | Silent catch swallows errors | Critique M9 | 🟡 |
| #68 | shared/frameworks.ts reverse dependency | Critique m1 | 🔵 |
| #69 | .npmrc deprecated pnpm config flags | Critique m3 | 🔵 |
| #70 | CI security-scan duplicates pnpm install | Critique m7 | 🔵 |
| #71 | Remove unused _label param in buildSectionContent | Critique m10 | 🔵 |

**Stats:** 26 original issues → 29/32 fixes verified, 3 missing. 25 CRITIQUE items → 15 new issues created. **23 total open issues.**
