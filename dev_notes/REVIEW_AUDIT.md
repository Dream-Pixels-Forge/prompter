# Review Audit — ISSUES_FIXED.md Cross-Check

Full source code audit conducted 2026-05-24. Every fix claimed in `ISSUES_FIXED.md` verified against actual current source code.

---

## Summary

| Category | Count |
|----------|-------|
| Fixes correctly implemented | 29 of 32 |
| Fixes claimed but NOT implemented | 3 |
| New issues created from findings | 7 |

---

## ✅ Correctly Implemented (29)

### Critical (4)
| # | Claimed Fix | Verified At | Status |
|---|-------------|-------------|--------|
| #17 | Stale closure in bubble drag — `positionRef` synced via `useEffect` | `useBubblePosition.ts:48-49` | ✅ |
| #18 | Main process imports renderer code — moved to `shared/frameworks.ts` | `orchestrator.ts:4` imports from shared | ✅ |
| #19 | `any` types in preload — typed from `shared/types` | `preload/index.ts` | ✅ |
| #20 | `(settings as any)` cast — direct property access | `ipc.ts:95` | ✅ |

### High (6)
| # | Claimed Fix | Verified At | Status |
|---|-------------|-------------|--------|
| #21 | Dead FrameworkSelector.tsx — deleted | File not found | ✅ |
| #22 | Unused `history` field in prompt-store — removed | `prompt-store.ts` | ✅ |
| #23 | No debounce — 300ms debounce added | `InputArea.tsx:23-34` | ✅ |
| #24 | Missing IPC validation — `validateId/Service/TextLength` | `ipc.ts:18-35` | ✅ |
| #25 | Web Speech types inline — moved to `env.d.ts` | `env.d.ts` exists + `stt.ts` clean | ✅ |
| #26 | Race on history inserts — `writeQueue` promise-chain | `storage.ts:14,23-25` | ✅ |

### Medium (5)
| # | Claimed Fix | Verified At | Status |
|---|-------------|-------------|--------|
| #28 | Fragile settings serialization — explicit pick | `settings-store.ts:57-67` | ✅ |
| #29 | `sandbox: false` → `sandbox: true` | `main.ts:34` | ✅ |
| #30 | Backdrop exit animation — GSAP exit | `App.tsx:52-58` | ✅ |
| #32 | CSP `connect-src` wildcard — scoped to `localhost:11434` | `index.html:6` | ✅ |
| #33 | API keys in main process memory — reads from storage on demand | `ipc.ts:95` | ✅ |

### Low (9)
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

### Third Pass (8)
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

---

## ❌ NOT Implemented (3 — claimed fixed but code unchanged)

### #53 (was #46) — `whisper.ts:36` still has `body as any`
**Claimed:** "Changed to `body` — no cast needed"
**Actual:** `body: body as any,` unchanged

### #54 (was #48) — Dead stream functions still present
**Claimed:** "Removed all three stream functions (~120 lines)"
**Actual:**
- `openai.ts:66-134` — `streamOpenAI` still present
- `anthropic.ts:70-159` — `streamAnthropic` + `AnthropicStreamChunk` still present
- `ollama.ts:66-135` — `streamOllama` still present
- `types.ts:90-94` — `StreamChunk` interface still present

### #55 (was #37 Bubble) — `Bubble.tsx` missing `aria-label="Open Prompter"`
**Claimed:** "Added aria-label to Bubble button"
**Actual:** Button at `Bubble.tsx:42` has no `aria-label`

---

## 🆕 New Findings (issues created)

| # | Description | Severity | File |
|---|-------------|----------|------|
| #50 | `useEffect` after conditional early return (rules-of-hooks violation) | Medium | `OutputPanel.tsx:16-22` |
| #51 | Missing `setTimeout` cleanup on copy feedback (same pattern as #44) | Low | `PromptSection.tsx:17` |
| #52 | No unmount guard on async `load()` — sets state after unmount | Low | `HistoryPanel.tsx:47` |
| #56 | `console.warn` runs on every render (not in `useEffect`) | Low | `TemplateBrowser.tsx:46-52` |

---

## Additional Minor Concerns (not yet issues)

| Observation | File | Note |
|-------------|------|------|
| GSAP `willChange: 'transform'` on infinite `repeat:-1 yoyo:true` animation | `Bubble.tsx:25` | Can accumulate GPU memory over long sessions |

---

## Issue Status

| # | Title | Status |
|---|-------|--------|
| #27 | Zero test coverage | Open (kept open by design) |
| #50 | OutputPanel rules-of-hooks violation | Open |
| #51 | PromptSection missing setTimeout cleanup | Open |
| #52 | HistoryPanel unmount guard | Open |
| #53 | whisper.ts body as any (ISSUES_FIXED.md un-fixed) | Open |
| #54 | Dead stream functions (ISSUES_FIXED.md un-fixed) | Open |
| #55 | Bubble.tsx missing aria-label (ISSUES_FIXED.md un-fixed) | Open |
| #56 | TemplateBrowser console.warn on every render | Open |

**Stats:** 26 original issues reviewed → 29/32 fixes verified, 3 fixes still missing, 7 new issues created.
