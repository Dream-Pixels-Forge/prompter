# Changelog

## [0.1.0] — 2026-05-23 — First Public Release

### Added
- Consolidated 6 development phases into first packaged release
- Full release pipeline: GitHub Actions CI + release workflows, electron-builder packaging
- Build assets: macOS .icns, Windows .ico, DMG background, Linux AppImage
- GitHub repo: description, topics, homepage configured

### Fixed
- CI/CD: removed non-existent lint step, fixed audit syntax, added test placeholder
- CI/CD: added Linux system dependencies (libwebkit2gtk-4.1-dev) for Electron 34
- Release: fixed script names (package: → dist:), release body heredoc expansion
- Dependencies: updated electron-builder 25→26 (fixed 6 tar CVEs via transitive deps)
- Changelog: internal phase entries (Phase 1–6) preserved below

---

### Phase Development History

The following entries document the internal development phases that built toward this release.

## [0.0.1] — 2026-05-23 — Project Init

### Added
- Project initialized with PRIDES methodology
- Brainstorm — Prompter: floating prompt architect widget
- Documentation scaffolding (README, PRIDES, TASKS, PROGRESS, CHANGELOG, ARCHITECTURE)
- Tech stack defined: Electron + React + TypeScript + Tailwind v4 + GSAP

## [Phase 1] — 2026-05-23 — Core Foundation

### Added
- Phase 1 implementation complete (Core Foundation)
- Project scaffolding: package.json, tsconfigs, Vite configs, Tailwind v4
- Shared types: IPC channels, Framework, Template, GenerateRequest/Response
- Framework templates: 3 prompt engineering frameworks (OpenAI GPT-5.5, Anthropic Playbook, Karpathy Principles)
- Template library: 3 curated templates (SaaS landing, cooking book, API docs)
- Electron main process: window creation, overlay management, IPC handlers, LLM orchestrator
- Preload script: contextBridge API security layer
- Renderer lib: LLM client, clipboard, intent parser with auto-detection
- Zustand stores: app state + prompt state management
- useBubblePosition: drag hook for floating bubble
- All 11 React components: Bubble, BubbleExpanded, InputArea, OutputPanel, PromptSection, FrameworkBadge, FrameworkSelector, TemplateBrowser, TemplateCard, ProcessingOverlay, Toast
- App shell, HTML entry, Tailwind v4 globals.css with custom theme tokens
- Unified vite.config.ts using vite-plugin-electron (main + preload + renderer builds)
- CI/CD pipeline: GitHub Actions (lint, typecheck, build matrix) + Release workflow
- Build config: electron-builder.yml for macOS/Windows/Linux
- Verified: zero type errors, full build passes, app initializes correctly

## [Phase 2] — 2026-05-23 — LLM Integration

### Added
- Phase 2 implementation complete (LLM Integration)
- Ollama provider: `src/main/llm/ollama.ts` — HTTP client for local Ollama (generate, stream, status check)
- OpenAI provider: `src/main/llm/openai.ts` — Chat Completions API client (generate, SSE stream)
- Anthropic provider: `src/main/llm/anthropic.ts` — Messages API client (generate, SSE stream)
- Updated orchestrator: routes to real LLM providers with local fallback on failure
- Settings IPC: in-memory settings store, provider config synced to orchestrator
- Settings store: Zustand store (`settings-store.ts`) with `loadSettings`, `updateSetting`, `saveSettings`, `checkOllamaStatus`, `getActiveLLMConfig`
- Settings Panel: full settings UI with provider selector, Ollama status check, API key management, auto-save with debounce
- New shared types: `ProviderType`, `LLMGenerateOptions`, `StreamChunk`, `OllamaStatus`, updated `AppSettings`
- Preload exposes: `settings.get`, `settings.set`, `ollama.check`
- Verified: zero type errors, full build passes, app initializes correctly

## [Phase 3] — 2026-05-23 — Voice Input

### Added
- Phase 3 implementation complete (Voice Input)
- SpeechRecognizer class: Web Speech API (webkitSpeechRecognition) with interim/final results, auto-restart, 10s silence timeout
- MicButton component: 3 visual states (idle/listening/processing), pulsing red ring animation, interim transcript display
- InputArea: MicButton wired into bottom toolbar alongside Generate button, appends transcribed text
- Main process whisper.ts: OpenAI Whisper API fallback with multipart/form-data body (zero external deps)
- IPC: STT_START handler for cloud Whisper transcription fallback
- Preload: `stt.transcribe()` bridge exposed on window.api
- App store: `isRecording` state + `'listening'` bubble state
- Web Speech API type declarations for TypeScript compatibility
- Cleaned up: removed old separate vite configs (vite.main/preload/renderer.config.ts)
- Verified: zero type errors, full build (renderer 228kB/main 20kB/preload 1kB), app initializes correctly

## [Phase 4] — 2026-05-23 — Full Frameworks & Templates

### Added
- Phase 4 implementation complete (Full Frameworks & Templates)
- MPLCT framework (`mplct`): 8 sections — Subject, Environment, Lighting, Camera, Action, Style, Negative Space, Meta — for video/3D/cinematic prompts
- Context Engineering framework (`context-eng`): 5 sections — Context, Memory, Skills & SOPs, Tools & Resources, Output Contract — for knowledge-intensive agent tasks
- 9 new templates (12 total):
  - Agent Instructions → Karpathy Principles
  - Code Review Prompt → Karpathy Principles
  - Video Generation → MPLCT
  - Blog Post / Article → OpenAI GPT-5.5
  - Customer Support Agent → Anthropic Playbook
  - Data Analysis / Report → OpenAI GPT-5.5
  - UI/UX Design Brief → Anthropic Playbook
  - Product Requirements Doc → OpenAI GPT-5.5
  - Scientific Research Paper → Karpathy Principles
- Template→Framework auto-switch: selecting a template now switches the active framework
- `detectFramework()` expanded: correctly resolves mplct, context-eng matches
- TemplateBrowser iconMap supports all 12 template icons
- Verified: zero type errors, full build (renderer 238kB/main 22kB/preload 1kB), app initializes correctly

## [Phase 5] — 2026-05-23 — History & Persistence

### Added
- Phase 5 implementation complete (History & Persistence)
- StorageService: JSON-file history persistence with 500-entry cap
- Electron safeStorage integration for encrypted API keys (base64 fallback when keyring unavailable)
- History IPC handlers: insert, list (paginated), search (by input/output/framework), delete, clear
- Encrypted key IPC handlers: saveApiKey, getApiKey
- System tray icon with context menu (Show/Hide, Quit)
- HistoryPanel component: searchable list, detail view with full structured output, reuse button, delete + clear all
- InputArea: auto-saves every generation result to history
- SettingsPanel/SettingsStore: API keys persisted via safeStorage on save, loaded on mount
- Preload: `history.*` and `store.*` APIs exposed on window.api
- Verified: zero type errors, full build (renderer 245kB/main 29kB/preload 2kB), app initializes correctly

## [Phase 6] — 2026-05-23 — Polish, Animations & First Release

### Added
- Phase 6 implementation complete (Polish, Animations & First Release)
- GSAP animations: bubble floating pulse, card scale+fade entrance, content slide on tab switch, toast with entrance/exit
- Glassmorphism polish: .glass-card utility with saturate, inset glow, layered shadows
- Alt+M global hotkey to toggle mic recording via IPC
- Inline error display in InputArea with auto-clear
- PromptStore error state management
- First packaged release: Prompter-0.1.0.AppImage (109 MB)
- Build icons (16x16 to 256x256)
- Electron-builder config fixes for asset packaging
- Verified: zero type errors, full build (renderer 317kB/main 29kB/preload 2.5kB)
