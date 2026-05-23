# Changelog

## [0.0.1] — 2026-05-23

### Added
- Project initialized with PRIDES methodology
- Brainstorm — Prompter: floating prompt architect widget
- Documentation scaffolding (README, PRIDES, TASKS, PROGRESS, CHANGELOG, ARCHITECTURE)
- Tech stack defined: Electron + React + TypeScript + Tailwind v4 + GSAP

## [0.1.0] — 2026-05-23

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

## [0.2.0] — 2026-05-23

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
