# Tasks

## Phase P — Prototype ✅

- [x] **P-1** Generate ideas and feature concepts
- [x] **P-2** Analyze requirements and feasibility
- [x] **P-3** Create Product Requirements Document
- [x] **P-4** Develop architecture plan and implementation roadmap
- [x] **P-5** Build initial prototype/proof-of-concept

## Phase R — Review ✅

- [x] **R-1** Review prototype and provide feedback
- [x] **R-2** Code inspection and quality assessment
- [x] **R-3** Git repository setup and version control

## Phase I — Implement (Phase 1 complete, continuing)

### Phase 1: Core Foundation ✅

- [x] **I-1.1** Project scaffolding (package.json, tsconfigs, Vite configs, Tailwind v4)
- [x] **I-1.2** Shared types + framework templates + template library
- [x] **I-1.3** Electron main process + LLM orchestrator + preload
- [x] **I-1.4** Renderer: lib, stores, intent parser, hooks
- [x] **I-1.5** Renderer: all 11 React components
- [x] **I-1.6** App entry (App.tsx, main.tsx, index.html, globals.css)
- [x] **I-1.7** Dependency installation + build verification

### Phase 2: LLM Integration (upcoming)

- [ ] **I-2.1** Ollama provider — local LLM integration
- [ ] **I-2.2** OpenAI provider — cloud fallback
- [ ] **I-2.3** Anthropic provider — cloud fallback
- [ ] **I-2.4** Provider selection UI + API key management
- [ ] **I-2.5** Streaming output display

### Phase 3: Voice Input (upcoming)

- [ ] **I-3.1** Whisper (local) STT integration
- [ ] **I-3.2** Hold-to-speak bubble interaction
- [ ] **I-3.3** Voice activity detection + waveform

### Phase 4: Polish & Distribution (upcoming)

- [ ] **I-4.1** History + search functionality
- [ ] **I-4.2** GSAP animations for bubble transitions
- [ ] **I-4.3** Settings panel + system tray
- [ ] **I-4.4** Template library expansion (12+ templates)

## Phase D — Deploy

- [x] **D-1** Set up CI/CD pipeline
- [x] **D-2** Build configuration for macOS/Windows/Linux
- [ ] **D-3** First packaged release

## Phase E — Extend

- [ ] **E-1** Plugin system for custom frameworks
- [ ] **E-2** Cloud sync for history

## Phase S — Secure

- [x] **S-1** Security architecture document created
- [x] **S-2** Electron hardening (contextIsolation, sandbox, CSP)
- [ ] **S-3** API key encryption with safeStorage
- [ ] **S-4** Permission model for mic access
