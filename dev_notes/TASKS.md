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

## Phase I — Implement

### Phase 1: Core Foundation ✅

- [x] **I-1.1** Project scaffolding (package.json, tsconfigs, Vite configs, Tailwind v4)
- [x] **I-1.2** Shared types + framework templates + template library
- [x] **I-1.3** Electron main process + LLM orchestrator + preload
- [x] **I-1.4** Renderer: lib, stores, intent parser, hooks
- [x] **I-1.5** Renderer: all 11 React components
- [x] **I-1.6** App entry (App.tsx, main.tsx, index.html, globals.css)
- [x] **I-1.7** Dependency installation + build verification

### Phase 2: LLM Integration ✅

- [x] **I-2.1** Ollama provider — local LLM integration
- [x] **I-2.2** OpenAI provider — cloud fallback
- [x] **I-2.3** Anthropic provider — cloud fallback
- [x] **I-2.4** Provider selection UI + API key management
- [x] **I-2.5** Streaming output display

### Phase 3: Voice Input ✅

- [x] **I-3.1** Web Speech API speech recognition
- [x] **I-3.2** MicButton with recording states + visual feedback
- [x] **I-3.3** OpenAI Whisper API fallback (main process)

### Phase 4: Full Frameworks & Templates ✅

- [x] **I-4.1** MPLCT framework (video/3D prompts)
- [x] **I-4.2** Context Engineering framework
- [x] **I-4.3** 9 additional templates (agent-prompt, code-review, video-gen, blog-post, etc.)
- [x] **I-4.4** Template→Framework mapping

### Phase 5: History & Persistence ✅

- [x] **I-5.1** History persistence (JSON-file, 500-entry cap)
- [x] **I-5.2** History CRUD (list, search, delete, clear, insert)
- [x] **I-5.3** Encrypted API key storage with safeStorage
- [x] **I-5.4** System tray icon + context menu

### Phase 6: Polish & Distribution ✅

- [x] **I-6.1** GSAP animations for bubble transitions
- [x] **I-6.2** Glassmorphism polish (.glass-card utility)
- [x] **I-6.3** Hotkey registration (Alt+Space, Alt+M)
- [x] **I-6.4** Drag-to-reposition with persistence (localStorage)
- [x] **I-6.5** Error handling inline display
- [x] **I-6.6** First packaged release (Prompter-0.1.0.AppImage)

## Phase D — Deploy

- [x] **D-1** Set up CI/CD pipeline
- [x] **D-2** Build configuration for macOS/Windows/Linux
- [ ] **D-3** First packaged release

## Phase I — Implement (Bug Fixes)

### Layout Bug Fixes ✅

- [x] **I-B1** (#1) History Panel max-h overflow: replaced `max-h-[380px]` with flex-based dynamic sizing
- [x] **I-B2** (#2) Frameless window drag: added `-webkit-app-region: drag` to header
- [x] **I-B3** (#3) z-index collision: ProcessingOverlay 40 → 50
- [x] **I-B4** (#4) Toast overlap: dynamic position based on card expanded state
- [x] **I-B5** (#5) Template grid: added `auto-rows-fr` for equal-height cards
- [x] **I-B6** (#6) Window width: 360px → 460px for 420px card fit
- [x] **I-B7** (#7) Bubble dual-positioning: refactored to absolute viewport coordinates with legacy migration

## Phase E — Extend

- [ ] **E-1** Plugin system for custom frameworks
- [ ] **E-2** Cloud sync for history

## Phase S — Secure

- [x] **S-1** Security architecture document created
- [x] **S-2** Electron hardening (contextIsolation, sandbox, CSP)
- [ ] **S-3** API key encryption with safeStorage
- [ ] **S-4** Permission model for mic access
