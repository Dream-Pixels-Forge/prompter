# PromptForge — Implementation Plan

## File Tree

```
prompter/
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.main.config.ts
├── vite.preload.config.ts
├── vite.renderer.config.ts
├── electron-builder.yml
├── tailwind.config.ts               # Tailwind v4
├── postcss.config.js
├── public/
│   ├── icons/
│   │   ├── icon.png                 # App icon (512x512)
│   │   ├── tray-idle.png            # Tray icon (idle state)
│   │   └── tray-processing.png      # Tray icon (processing)
│   └── fonts/
│       ├── Inter-Variable.woff2
│       └── Fraunces-Variable.woff2
├── src/
│   ├── main/                        # Electron main process
│   │   ├── main.ts                  # Entry: app lifecycle, window creation
│   │   ├── overlay.ts               # AlwaysOnTop, bounds persistence
│   │   ├── tray.ts                  # System tray icon + context menu
│   │   ├── ipc.ts                   # All IPC handler registration
│   │   ├── ipc-handlers/
│   │   │   ├── llm.ts               # LLM invoke IPC handlers
│   │   │   ├── stt.ts               # Whisper STT IPC handlers
│   │   │   ├── storage.ts           # SQLite CRUD IPC handlers
│   │   │   ├── settings.ts          # Settings read/write IPC handlers
│   │   │   └── clipboard.ts         # Clipboard write IPC handler
│   │   ├── llm/
│   │   │   ├── orchestrator.ts      # LLM router: local → cloud fallback
│   │   │   ├── ollama.ts            # Ollama HTTP client
│   │   │   ├── openai.ts            # OpenAI API client
│   │   │   └── anthropic.ts         # Anthropic API client
│   │   ├── stt/
│   │   │   └── whisper.ts           # Whisper server management + STT
│   │   └── db/
│   │       ├── database.ts          # SQLite init, migrations, connection
│   │       ├── history.ts           # History CRUD
│   │       ├── templates.ts         # Saved templates CRUD
│   │       └── settings.ts          # Settings key-value store
│   ├── preload/
│   │   └── index.ts                 # contextBridge exposing IPC API
│   ├── renderer/                    # React app
│   │   ├── index.html
│   │   ├── main.tsx                 # React entry
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Bubble.tsx           # Floating bubble (dormant state)
│   │   │   ├── BubbleExpanded.tsx   # Expanded card container
│   │   │   ├── InputArea.tsx        # Text input + submit
│   │   │   ├── MicButton.tsx        # Mic with recording states + waveform
│   │   │   ├── OutputPanel.tsx      # Structured prompt display + copy
│   │   │   ├── PromptSection.tsx    # Individual framework section
│   │   │   ├── FrameworkBadge.tsx   # Detected framework indicator
│   │   │   ├── FrameworkSelector.tsx # Framework chooser dropdown
│   │   │   ├── TemplateBrowser.tsx  # Template library grid
│   │   │   ├── TemplateCard.tsx     # Individual template card
│   │   │   ├── HistoryPanel.tsx     # History list with search
│   │   │   ├── HistoryItem.tsx      # Single history entry
│   │   │   ├── SettingsPanel.tsx    # API keys, model, hotkeys
│   │   │   ├── ProcessingOverlay.tsx # Loading/shimmer overlay
│   │   │   └── Toast.tsx            # Brief notification toast
│   │   ├── lib/
│   │   │   ├── frameworks/
│   │   │   │   ├── index.ts         # Framework registry
│   │   │   │   ├── openai.ts        # OpenAI GPT-5.5
│   │   │   │   ├── anthropic.ts     # Anthropic Playbook
│   │   │   │   ├── mplct.ts         # Video/3D prompts
│   │   │   │   ├── karpathy.ts      # Karpathy Principles
│   │   │   │   └── context-eng.ts   # Context Engineering
│   │   │   ├── templates/
│   │   │   │   ├── index.ts         # Template registry (12 templates)
│   │   │   │   ├── saas-landing.ts
│   │   │   │   ├── cooking-book.ts
│   │   │   │   ├── api-docs.ts
│   │   │   │   ├── agent-prompt.ts
│   │   │   │   ├── code-review.ts
│   │   │   │   ├── video-gen.ts
│   │   │   │   ├── blog-post.ts
│   │   │   │   ├── support-agent.ts
│   │   │   │   ├── data-analysis.ts
│   │   │   │   ├── ux-brief.ts
│   │   │   │   ├── prd.ts
│   │   │   │   └── research-paper.ts
│   │   │   ├── intent-parser.ts     # Raw input → structured data
│   │   │   ├── llm.ts              # IPC bridge: renderer → main
│   │   │   ├── history.ts          # History IPC wrapper
│   │   │   └── clipboard.ts        # Clipboard write
│   │   ├── stores/
│   │   │   ├── app-store.ts        # Zustand: UI state (bubble, expanded, etc.)
│   │   │   ├── prompt-store.ts     # Zustand: input, output, framework, template
│   │   │   └── settings-store.ts   # Zustand: settings cache
│   │   ├── hooks/
│   │   │   └── useBubblePosition.ts # Drag + localStorage persistence
│   │   └── styles/
│   │       └── globals.css          # Tailwind v4 directives + base styles
│   └── shared/
│       └── types.ts                 # Shared types (IPC payloads, DB schemas)
└── scripts/
    ├── convert-icons.ts             # Generate app icons from source
    └── dev.sh                       # Dev launch script
```

---

## Dependency List

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.0",
    "gsap": "^3.12.0",
    "better-sqlite3": "^11.0.0",
    "uuid": "^10.0.0",
    "lucide-react": "^0.400.0",
    "react-markdown": "^9.0.0"
  },
  "devDependencies": {
    "electron": "^34.0.0",
    "electron-builder": "^25.0.0",
    "vite": "^6.0.0",
    "vite-plugin-electron": "^0.28.0",
    "vite-plugin-electron-renderer": "^0.14.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "typescript": "^5.6.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/better-sqlite3": "^7.6.0",
    "@types/uuid": "^10.0.0"
  }
}
```

---

## Build Configuration

### package.json Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit",
    "typecheck": "tsc --noEmit",
    "dist": "npm run build && electron-builder",
    "dist:mac": "npm run build && electron-builder --mac",
    "dist:win": "npm run build && electron-builder --win",
    "dist:linux": "npm run build && electron-builder --linux"
  }
}
```

### electron-builder.yml
```yaml
appId: com.promptforge.app
productName: PromptForge
directories:
  output: dist-electron
  buildResources: public
files:
  - dist/**/*
  - src/main/**/*
  - src/preload/**/*
mac:
  category: public.app-category.productivity
  target: [dmg, zip]
  artifactName: PromptForge-${version}-mac.${ext}
win:
  target: [nsis, portable]
  artifactName: PromptForge-${version}-win.${ext}
linux:
  target: [AppImage, deb]
  artifactName: PromptForge-${version}-linux.${ext}
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

---

## Implementation Phases

---

### Phase 1: Core Foundation (Days 1-3)

**Goal:** Working Electron app with bubble, text input, template system, LLM orchestrator, and output display.

#### Files to Create

| File | Purpose |
|---|---|
| `package.json`, `tsconfig.json`, `tsconfig.node.json` | Project scaffolding |
| `vite.main.config.ts`, `vite.preload.config.ts`, `vite.renderer.config.ts` | Vite configs for each Electron process |
| `tailwind.config.ts`, `postcss.config.js` | Tailwind v4 setup |
| `src/main/main.ts` | App lifecycle, window creation (`BrowserWindow` with `frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true`) |
| `src/main/overlay.ts` | Window positioning, bounds persistence via `electron-store` |
| `src/main/ipc.ts` | Registrations for LLM invoke + clipboard IPC handlers |
| `src/main/ipc-handlers/clipboard.ts` | `clipboard.writeText()` handler |
| `src/main/ipc-handlers/llm.ts` | Local-first LLM invocation handler |
| `src/main/llm/orchestrator.ts` | Routes to Ollama, falls back to configured cloud |
| `src/main/llm/ollama.ts` | `fetch()` to `http://localhost:11434/api/generate` |
| `src/main/llm/openai.ts` | OpenAI SDK wrapper |
| `src/main/llm/anthropic.ts` | Anthropic SDK wrapper |
| `src/preload/index.ts` | `contextBridge.exposeInMainWorld('api', {...})` |
| `src/renderer/index.html` | HTML entry |
| `src/renderer/main.tsx` | React root |
| `src/renderer/App.tsx` | Bubble → ExpandedCard state machine |
| `src/renderer/components/Bubble.tsx` | Dormant pill (60×32px), click expands |
| `src/renderer/components/BubbleExpanded.tsx` | 320px panel with InputArea + OutputPanel |
| `src/renderer/components/InputArea.tsx` | Textarea + Generate button, Ctrl+Enter submit |
| `src/renderer/components/OutputPanel.tsx` | Structured prompt display + Copy button |
| `src/renderer/components/PromptSection.tsx` | Renders a framework section with header + body |
| `src/renderer/components/FrameworkBadge.tsx` | Badge showing auto-detected framework |
| `src/renderer/components/FrameworkSelector.tsx` | Dropdown to override framework |
| `src/renderer/components/TemplateBrowser.tsx` | Grid of template cards |
| `src/renderer/components/TemplateCard.tsx` | Single template with icon + name + description |
| `src/renderer/components/ProcessingOverlay.tsx` | Shimmer/loading state |
| `src/renderer/components/Toast.tsx` | Brief "Copied!" notification |
| `src/renderer/lib/frameworks/index.ts` | Registry: `Framework[]` with name, description, sections |
| `src/renderer/lib/frameworks/openai.ts` | 7-section template (Role, Personality, Goal, etc.) |
| `src/renderer/lib/frameworks/anthropic.ts` | XML-tagged sections |
| `src/renderer/lib/frameworks/karpathy.ts` | 4-principle template |
| `src/renderer/lib/templates/index.ts` | Registry: `Template[]` with framework mapping |
| `src/renderer/lib/templates/saas-landing.ts` | SaaS Landing template |
| `src/renderer/lib/templates/cooking-book.ts` | Recipe template |
| `src/renderer/lib/templates/api-docs.ts` | API Docs template |
| `src/renderer/lib/intent-parser.ts` | Keyword-based framework auto-detection |
| `src/renderer/lib/llm.ts` | `window.api.invoke('llm:generate', payload)` wrapper |
| `src/renderer/stores/app-store.ts` | Zustand: `bubbleState`, `isExpanded`, `isProcessing` |
| `src/renderer/stores/prompt-store.ts` | Zustand: `input`, `output`, `selectedFramework`, `selectedTemplate` |
| `src/shared/types.ts` | IPC channel names, payload interfaces |
| `src/renderer/styles/globals.css` | Tailwind v4 `@import "tailwindcss"`, glass utilities |

#### Key Implementation Details

- **Window config:** `width: 320, height: 400, frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true, resizable: false, hasShadow: false, type: 'panel'`
- **Bubble positioning:** Absolute positioned within the Electron window. Window itself is repositioned on drag (not just the bubble element).
- **Data flow:** InputArea → `prompt-store.setInput()` → Generate → `intent-parser.ts` → framework + template match → framework filled with parsed data → IPC `llm:generate` → orchestrator → Ollama → output returned → `prompt-store.setOutput()` → OutputPanel renders
- **3 templates in phase 1:** SaaS Landing Page, Cooking Book, API Docs (all use OpenAI framework)
- **3 frameworks in phase 1:** OpenAI GPT-5.5, Karpathy Principles, Anthropic Playbook (MPLCT and Context Engineering deferred to Phase 2)

#### Dependencies to Install
```
pnpm add react react-dom zustand gsap uuid lucide-react react-markdown
pnpm add -D electron electron-builder vite vite-plugin-electron vite-plugin-electron-renderer @vitejs/plugin-react tailwindcss @tailwindcss/vite typescript @types/react @types/react-dom @types/uuid
```

#### Verification
- [ ] App launches as transparent frameless window on top of all apps
- [ ] Bubble renders in bottom-right, click expands to card
- [ ] Typing in textarea and pressing Ctrl+Enter triggers IPC to main
- [ ] Ollama responds with structured output rendered in OutputPanel
- [ ] Copy button writes prompt to clipboard with "Copied!" toast
- [ ] All 3 templates produce usable output when selected
- [ ] Framework badge auto-detects correctly based on intent keywords
- [ ] Dismiss expands with Escape, returns to bubble state

---

### Phase 2: Voice & Full Frameworks (Days 4-6)

**Goal:** Voice input via Whisper, all 5 frameworks, all 12 templates, framework auto-detection.

#### Files to Create/Modify

| File | Action | Purpose |
|---|---|---|
| `src/main/ipc-handlers/stt.ts` | Create | Whisper IPC handler |
| `src/main/stt/whisper.ts` | Create | Whisper server management (`child_process.spawn`), audio file transcription |
| `src/renderer/components/MicButton.tsx` | Create | Mic toggle with recording states + waveform canvas |
| `src/renderer/lib/frameworks/mplct.ts` | Create | Video prompt framework (8 sections) |
| `src/renderer/lib/frameworks/context-eng.ts` | Create | Context Engineering framework (5 sections) |
| `src/renderer/lib/templates/agent-prompt.ts` | Create | Agent Instructions template |
| `src/renderer/lib/templates/code-review.ts` | Create | Code Review template |
| `src/renderer/lib/templates/video-gen.ts` | Create | Video Generation template |
| `src/renderer/lib/templates/blog-post.ts` | Create | Blog Post template |
| `src/renderer/lib/templates/support-agent.ts` | Create | Customer Support Agent template |
| `src/renderer/lib/templates/data-analysis.ts` | Create | Data Analysis template |
| `src/renderer/lib/templates/ux-brief.ts` | Create | UI/UX Design Brief template |
| `src/renderer/lib/templates/prd.ts` | Create | Product Requirements Doc template |
| `src/renderer/lib/templates/research-paper.ts` | Create | Research Paper template |
| `src/renderer/components/InputArea.tsx` | Modify | Add mic button, recording state indicator |
| `src/renderer/components/BubbleExpanded.tsx` | Modify | Add TemplateBrowser integration |
| `src/renderer/lib/intent-parser.ts` | Modify | Add MPLCT and Context Engineering detection rules |
| `src/renderer/lib/templates/index.ts` | Modify | Register all 12 templates |
| `src/renderer/lib/frameworks/index.ts` | Modify | Register all 5 frameworks |

#### Key Implementation Details

- **Whisper integration:** Main process spawns `whisper.cpp` or uses `openai-whisper` Python package via `child_process`. Audio captured via `MediaRecorder` in renderer, sent to main as `Buffer` via IPC, written to temp file, transcribed, result returned.
- **Waveform animation:** Canvas-based real-time FFT visualization using `AnalyserNode` from Web Audio API. Rendered in `MicButton.tsx` when recording.
- **Template → Framework mapping:** Each template in the registry specifies its target framework. When a template is selected, the framework auto-switches.
- **All 12 templates:** Each is a TypeScript object with `name`, `description`, `icon`, `domain`, `audienceHint`, `framework` (framework name), and `defaultPrompt` (placeholder text).

#### Verification
- [ ] Mic button toggles recording, shows waveform animation
- [ ] Spoken input transcribed to text in textarea
- [ ] All 5 frameworks produce correct, complete output when manually selected
- [ ] Framework auto-detection correctly identifies intent for all 5 frameworks
- [ ] All 12 templates appear in TemplateBrowser and produce usable output
- [ ] Selecting a template switches input placeholder and framework
- [ ] Template → framework mapping works (e.g., Video Gen → MPLCT, Agent → Karpathy)

---

### Phase 3: History & Settings (Days 7-8)

**Goal:** SQLite persistence for history, encrypted API key storage, settings panel, system tray.

#### Files to Create/Modify

| File | Action | Purpose |
|---|---|---|
| `src/main/db/database.ts` | Create | SQLite init, schema migrations, connection singleton |
| `src/main/db/history.ts` | Create | History CRUD (insert, list, search, delete) |
| `src/main/db/templates.ts` | Create | Saved templates CRUD |
| `src/main/db/settings.ts` | Create | Settings key-value store |
| `src/main/ipc-handlers/storage.ts` | Create | History IPC handlers |
| `src/main/ipc-handlers/settings.ts` | Create | Settings IPC handlers (with `safeStorage` encrypt/decrypt) |
| `src/main/tray.ts` | Create | System tray icon + context menu |
| `src/renderer/components/HistoryPanel.tsx` | Create | History list with search |
| `src/renderer/components/HistoryItem.tsx` | Create | Single history entry |
| `src/renderer/components/SettingsPanel.tsx` | Create | Settings form |
| `src/renderer/lib/history.ts` | Create | History IPC wrapper |
| `src/renderer/stores/settings-store.ts` | Create | Settings cache Zustand store |
| `src/main/main.ts` | Modify | Integrate tray setup, minimize-to-tray behavior |
| `src/renderer/App.tsx` | Modify | Add HistoryPanel and SettingsPanel routing |
| `src/renderer/components/BubbleExpanded.tsx` | Modify | Add history/settings tab navigation |
| `src/renderer/components/OutputPanel.tsx` | Modify | Save to history on generate |

#### Key Implementation Details

- **Database path:** `app.getPath('userData')/promptforge.db`
- **Encrypted API keys:** `safeStorage.encryptString()` for write, `safeStorage.decryptString()` for read. Key values stored as hex-encoded `Buffer.toString('hex')`. Decrypted in-memory only when making API calls, never written to renderer.
- **History search:** SQL `LIKE '%keyword%'` on both `raw_input` and `generated_prompt` columns. Debounced at 300ms in the renderer before calling IPC.
- **Settings sync:** On app start, settings are loaded from SQLite into `settings-store`. On change, settings are written to DB via IPC. API keys are loaded as masked (hidden) values — decrypted only on save or API call.
- **System tray:** `Tray` with context menu: Open, Toggle Mic, Recent History (max 5), Settings, Quit. Window close event hides to tray instead of quitting.

#### Verification
- [ ] History saves automatically when prompt is generated
- [ ] History panel lists entries sorted by recency, paginated 20/page
- [ ] Search filters history by keyword with debounce
- [ ] Clicking history entry loads input back into composer
- [ ] Delete removes entry, "Clear all" removes all
- [ ] Settings panel saves API keys (encrypted) and model selection
- [ ] Encrypted keys survive app restart and can be read back
- [ ] System tray shows with context menu
- [ ] Closing window minimizes to tray, Quit exits

---

### Phase 4: Polish & Animations (Days 9-10)

**Goal:** GSAP animations, glassmorphism polish, drag-to-reposition, hotkeys, error handling, build config.

#### Files to Create/Modify

| File | Action | Purpose |
|---|---|---|
| `src/renderer/hooks/useBubblePosition.ts` | Create | Drag + localStorage position persistence |
| `src/main/main.ts` | Modify | Register global shortcuts (`Alt+Space`, `Alt+M`, `Alt+C`) |
| `src/renderer/App.tsx` | Modify | GSAP entrance/exit animations on all state transitions |
| `src/renderer/components/Bubble.tsx` | Modify | GSAP scale, fade, clip-path transitions |
| `src/renderer/components/BubbleExpanded.tsx` | Modify | GSAP expand/collapse animation, framer-motion-like staggered children |
| `src/renderer/components/OutputPanel.tsx` | Modify | GSAP section reveal animations |
| `src/renderer/components/InputArea.tsx` | Modify | Character count, soft/hard limit warnings, error display |
| `src/renderer/components/ProcessingOverlay.tsx` | Modify | GSAP shimmer/pulse animation |
| `src/renderer/styles/globals.css` | Modify | Glassmorphism (`backdrop-blur-2xl`, border `rgba(255,255,255,0.06)`), premium dark theme |
| `electron-builder.yml` | Create | Build distribution config |
| `scripts/convert-icons.ts` | Create | Icon generation script |
| `public/icons/icon.png` | Add | App icon |
| `public/icons/tray-idle.png` | Add | Tray idle icon |
| `public/icons/tray-processing.png` | Add | Tray processing icon |

#### Key Implementation Details

- **GSAP transitions:**
  - Bubble → Expanded: `gsap.fromTo(card, { scale: 0.8, opacity: 0, clipPath: 'circle(0%)' }, { scale: 1, opacity: 1, clipPath: 'circle(100%)', duration: 0.3, ease: 'back.out(1.7)' })`
  - Output sections: staggered `gsap.from(sections, { y: 20, opacity: 0, stagger: 0.05 })`
  - Processing overlay: `gsap.to(shimmer, { x: '100%', duration: 1.5, repeat: -1 })`
- **Drag-to-reposition:** `mousedown`/`mousemove`/`mouseup` on bubble. Window is repositioned via `ipcRenderer.invoke('window:setBounds', { x, y })`. Position saved to localStorage on drag end.
- **Global hotkeys:** `globalShortcut.register('Alt+Space', ...)` in main. Sends IPC to toggle bubble visibility. `Alt+M` toggles mic, `Alt+C` opens quick capture (expands bubble + focuses input).
- **Glassmorphism design:** Background `rgba(28, 25, 23, 0.85)` with `backdrop-blur-2xl`, border `1px solid rgba(255,255,255,0.06)`, box shadow `0 8px 32px rgba(0,0,0,0.4)`. Accent color `#2D4A7A → #4A7FA0` gradient.
- **Error handling:** Each IPC channel has a try/catch wrapper. Errors from LLM calls show inline in InputArea (not dialog). Network errors show "Ollama not running — configure cloud API in Settings" with a link.

#### Verification
- [ ] All state transitions animate smoothly (< 200ms)
- [ ] Bubble can be dragged and repositioned, position persists across restart
- [ ] `Alt+Space` toggles bubble visibility globally from any app
- [ ] Character counter shows, hard limit enforced at 5000
- [ ] Error states display inline without crashing
- [ ] Glassmorphism renders correctly with backdrop blur
- [ ] Production build compiles (`pnpm run build`)
- [ ] App runs from packaged binary (dmg/AppImage/nsis)

---

## Test Strategy

| Phase | Testing Approach | Validation |
|---|---|---|
| **P1** | Manual + Console | Launch app, verify window props, type & generate, inspect IPC payloads in DevTools console. Test all 3 templates produce well-formed prompts. |
| **P2** | Manual | Record audio, verify transcription. Select each framework, verify output structure. Select each template, verify placeholder + framework mapping. |
| **P3** | Manual + SQLite CLI | Generate prompts, inspect `~/.promptforge/history.db` with `sqlite3`. Search, delete, reload. Save API keys, restart app, verify they persist encrypted. |
| **P4** | Visual + Keyboard | Observe animations. Drag bubble. Test hotkeys from other apps. Run `pnpm run dist:mac` (or platform equivalent) and verify packaged app. |
| **Pre-release** | Full checklist against Release Criteria (PRD §9) | All 13 criteria must pass on macOS and Windows before tagging v1.0. |

---

## Success Criteria (per PRD §9)

1. Bubble renders transparent, frameless, always-on-top — correct drag
2. Text input → structured prompt via Ollama
3. 2 of 5 frameworks produce correct output (OpenAI GPT-5.5 + Karpathy)
4. 6 of 12 templates produce usable output
5. Voice → Whisper → textarea
6. History saves, lists, searches, re-loads
7. Copy → clipboard
8. Settings persist API keys (encrypted), model, hotkeys
9. System tray minimize + restore
10. `Alt+Space` global toggle
11. Launch, exit, relaunch without crash (macOS + Windows)
12. Memory < 200MB during sustained use
13. No unhandled errors in main or renderer
