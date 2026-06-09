# Changelog

## [0.3.4] — 2026-06-09 — Senior Dev Critique Fixes

### Added
- **ErrorBoundary** component wrapping the entire app — catches render errors with a recovery UI instead of white-screen crash
- **Dynamic version badge** — reads `app.getVersion()` from main process instead of hardcoded `v0.1`
- **LLM retry logic** — `fetchWithTimeout` now retries transient errors (429, 502, 503, 504, network) up to 2 times with exponential backoff
- **Fallback warning toast** — when LLM is unavailable and local template fallback is used, a warning toast explains what happened
- **Batch API key status check** — single IPC call instead of N calls when loading settings panel
- **API key status cache** — `StorageService` caches key existence checks to avoid repeated file reads
- **Per-request LLM cancellation** — `LLM_CANCEL` now accepts an optional `requestId` to cancel a specific request
- **Async file writes** — `StorageService` now uses `fs.promises.writeFile` instead of `writeFileSync` to avoid blocking the main process event loop
- **Settings write debounce** — 300ms debounce on settings persistence to prevent race conditions from rapid changes
- **Tray icon fallback** — if `tray-icon.png` is missing, creates an empty native image instead of crashing
- **Encryption availability cache** — `safeStorage.isEncryptionAvailable()` result is cached after first call

### Changed
- **StorageService** — switched from `fs` sync to `fs/promises` async for all writes, added `getApiKeyStatuses()` batch method, added `invalidateKeyCache()` for cache invalidation
- **IPC handlers** — added `APP_GET_VERSION`, `HISTORY_KEY_STATUS` channels, updated `LLM_CANCEL` to accept optional requestId
- **Preload bridge** — added `app.getVersion()`, `history.getKeyStatuses()`, updated `llm.cancel()` signature
- **InputArea** — added `aria-label`, `aria-expanded`, `aria-current` attributes for framework dropdown accessibility
- **HistoryPanel** — added `aria-label` to delete, export, clear, search, load-more buttons
- **MicButton** — added `aria-label` and `aria-pressed` for voice toggle
- **SettingsPanel** — added `aria-label` to hotkey inputs, launch-on-startup checkbox, auto-hide range, theme select
- **ProviderConfigCard** — added `aria-label` to model dropdown/input, API key input, save button, check button, endpoint input, collapsed provider button
- **Toast** — added `aria-live="polite"` for screen reader announcements, `aria-hidden="true"` on decorative icon
- **OutputPanel** — added `aria-label` to "New Prompt" button

### Fixed
- **AbortController leak** — LLM cancel now properly tracks per-request controllers and cleans up on completion
- **Synchronous file I/O blocking main process** — all storage writes now use async `fs.promises.writeFile`
- **White-screen crash on component error** — added `ErrorBoundary` with recovery UI
- **Hardcoded version badge** — now shows actual app version from `package.json`
- **Settings race condition** — debounced writes prevent concurrent file corruption
- **Silent LLM fallback** — users now see a warning toast when local template is used instead of LLM output
- **N+1 IPC calls for key status** — batch `getKeyStatuses` reduces to single call
- **Missing accessibility labels** — added `aria-label` to all interactive elements
- **Unused biome-ignore comments** — removed stale suppression comments that no longer matched lint rules
- **Tray icon crash** — fallback to empty native image when icon file is missing
- **API key cache invalidation** — `saveApiKey` now invalidates cache for the affected service

## [0.2.0] — 2026-05-25 — Polish, Templates, & STT Improvements

### Added
- Right-click context menu on bubble: About (opens main window) and Quit (exits app), auto-flips to avoid viewport clipping
- 20 new templates → 32 total (8 per category): MCP Server, Code Review, Agent Instructions, System Architecture, CLI Tool, DB Schema, Test Plan, API Docs, Blog Post, Video Gen, Social Media, Newsletter, SEO Content, Tutorial, Podcast Script, Cooking Book, SaaS Landing, Data Analysis, PRD, Support Agent, Pitch Deck, Product Launch, Email Campaign, Competitor Analysis, UX Brief, Research Paper, Resume, Meeting Notes, Job Posting, Onboarding Guide, Legal/Policy Docs, Cover Letter
- TemplateBrowser icon mappings for all 32 templates
- Frameworks moved from `renderer/lib` to `shared/` for reuse across processes
- Karpathy Principles framework: `{goal}` placeholder now injects user intent into generated prompts
- STT interim text display below textarea with pulsing red-dot indicator
- `app:quit` IPC channel and preload bridge
- Frameworks contract test, intent parser test, orchestrator test, placeholder test

### Changed
- InputArea layout: bottom bar centered like media player controls (reset/mic/send), char count moved above textarea, textarea increased from 3→6 rows
- MicButton: increased to 64×64, added `onInterim` prop, removed local interim display
- TemplateBrowser: categories reorganized to 8 templates per group (Dev, Content, Business, Productivity)
- Window width increased from 360px → 460px for expanded card
- Bubble positioning: migrated from translate offsets to absolute viewport coordinates with auto-migration

### Fixed
- Framework auto-detection respects manual override via `manualFrameworkRef`
- STT permanent errors (permission denied, service not allowed) no longer infinite restart loop
- STT friendly error messages: "Microphone access denied" / "No microphone found" instead of raw errors
- Removed "Speech transcribed" toast on every final result
- Fixed `StorageService.getApiKey` static call bug (crashed on settings load)
- Bubble dual-positioning: refactored to absolute viewport coordinates
- Window width mismatch: 360px → 460px for 420px expanded card
- Template grid equal heights: `auto-rows-fr` added
- Toast overlap: dynamic position — top-right when expanded, bottom-right when collapsed
- z-index collision: ProcessingOverlay z-index 40 → 50
- Frameless window drag: `-webkit-app-region` on header, `no-drag` on close button
- History panel overflow: flex-based dynamic sizing instead of hardcoded `max-h-[380px]`
- Dynamic window resize for transparent frameless Electron
- GPU init errors on Linux: disabled HW acceleration, removed swiftshader
- HTML/#root transparency for invisible Electron frame
- Bubble click-through: mouse passthrough attached to widget only
- Fixed `legal/legal-template` id mismatch in TemplateBrowser

## [0.1.0] — 2026-05-23 — First Public Release

### Added
- Consolidated 6 development phases into first packaged release
- Full release pipeline: GitHub Actions CI + release workflows, electron-builder packaging
- Build assets: macOS .icns, Windows .ico, DMG background, Linux AppImage
- GitHub repo: description, topics, homepage configured

### Built With
- **LLM Model:** `deepseek-v4-flash-free` — primary reasoning model used for code generation, architecture decisions, and all implementation phases
