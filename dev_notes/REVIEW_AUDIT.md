# Review Audit — Deep Dive Verification

Full source code audit conducted 2026-05-24. Every file read directly to cross-check all 26 original GitHub issues against actual code.

---

## Summary

- **26 original issues** audited
- **16 closed** as already-fixed or never existed
- **5 updated** with corrected descriptions
- **7 new created** from verified findings

---

## Verified Issues (need fixing)

### High/Medium Priority

| # | Description | Severity | File |
|---|-------------|----------|------|
| #43 | Error-clearing effect cancels error display | Medium | `InputArea.tsx:40-44` |
| #45 | Non-null assertion crash on invalid state | Medium | `SettingsPanel.tsx:94` |

### Low Priority

| # | Description | Severity | File |
|---|-------------|----------|------|
| #44 | Missing setTimeout cleanup (minor leak) | Low | `OutputPanel.tsx:24` |
| #46 | `body as any` type escape | Low | `whisper.ts:36` |
| #47 | asarUnpack references non-existent `public/` | Low | `electron-builder.yml:28-30` |
| #48 | 428 lines dead stream functions + unused IPC channels | Low | `openai.ts`, `anthropic.ts`, `ollama.ts`, `types.ts` |
| #49 | ARCHITECTURE.md references non-existent files | Low | `dev_notes/ARCHITECTURE.md` |

### Updated Issues (partial fixes remain)

| # | Description | Remaining Gap |
|---|-------------|---------------|
| #24 | IPC validation exists but incomplete | LLM_GENERATE, SETTINGS_SET, HISTORY_INSERT lack validation |
| #26 | Write queue mitigates but in-memory mutation before enqueue | Minor wasted I/O, acceptable |
| #33 | API keys cached in memory for lifetime | Standard for Electron, document tradeoff |
| #37 | Most buttons have aria-labels | Bubble.tsx + TemplateCard.tsx missing |
| #42 | Regex has fuzzy matching but misses some LLM headings | Degrades gracefully to local fallback |

---

## Invalid Issues Closed (16)

| # | Claim | Reality |
|---|-------|---------|
| #17 | Stale closure in useBubblePosition | Uses positionRef (line 48-49) |
| #18 | Main imports renderer code | Pure-data files, works fine |
| #19 | `any` types in preload | All params typed from shared/types |
| #20 | `(settings as any)` cast | No such cast exists |
| #21 | FrameworkSelector.tsx dead | File never existed |
| #22 | Unused history field in prompt-store | No such field |
| #23 | No debounce | 300ms debounce at InputArea.tsx:23-33 |
| #25 | Web Speech types inline | env.d.ts exists |
| #28 | Fragile destructuring exclusion | Already uses explicit pick |
| #29 | sandbox: false | sandbox: true at main.ts:34 |
| #32 | CSP wildcard localhost | Scoped to port 11434 |
| #36 | Model lists duplicated | Shared from types.ts |
| #38 | No keyboard focus management | Auto-focus on mount |
| #39 | Hardcoded buildSectionContent | Data-driven via section.defaultContent |
| #40 | Missing fetch-with-timeout | file exists + used |
| #41 | Missing font loading | Loaded in index.html |
