# Prompter Architecture

## Overview

Prompter is a desktop floating overlay widget that accepts raw user intent (text or voice) and transforms it into structured, production-grade prompts using LLMs and established prompt engineering frameworks.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | **Electron** (frameless, alwaysOnTop, transparent window) |
| Frontend | **React 19** + **TypeScript** |
| Styling | **Tailwind CSS v4** |
| Animation | **GSAP** (clip-path reveals, state transitions) |
| Voice STT | **Whisper** (local via server) / Web Speech API fallback |
| Local LLM | **Ollama** (`llama3.2`/`deepseek-coder`) |
| Cloud LLM | **OpenAI** / **Anthropic** API |
| Storage | **JSON files** (history, settings, templates) via `safeStorage` encryption |
| State Mgmt | **Zustand** |
| Build | **electron-builder** / **Vite** |

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Main Process                 │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ TrayIcon   │  │ OverlayWindow│  │ IPC Handlers   │  │
│  │ (always    │  │ (frameless,  │  │                │  │
│  │  running)  │  │  alwaysOnTop)│  │                │  │
│  └────────────┘  └──────┬───────┘  └───────┬────────┘  │
│                         │                   │           │
└─────────────────────────┼───────────────────┼───────────┘
                          │                   │
┌─────────────────────────┼───────────────────┼───────────┐
│           Renderer Process (React)          │           │
│  ┌──────────────────────▼───────────────────▼───────┐  │
│  │                 App Root                          │  │
│  │  ┌──────────┐  ┌──────────────────────────────┐ │  │
│  │  │  Bubble  │  │      ExpandedCard             │ │  │
│  │  │  (dormant│  │  ┌────────┐ ┌──────────────┐ │ │  │
│  │  │   state) │  │  │ Input  │ │ OutputPanel  │ │ │  │
│  │  └──────────┘  │  │ Area   │ │ (structured  │ │ │  │
│  │                │  │        │ │  prompt)     │ │ │  │
│  │                │  └────────┘ └──────────────┘ │ │  │
│  │                │  ┌────────┐ ┌──────────────┐ │ │  │
│  │                │  │Templates│ │  History     │ │ │  │
│  │                │  │ Browser │ │  Panel       │ │ │  │
│  │                │  └────────┘ └──────────────┘ │ │  │
│  │                └──────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│                 LLM Orchestrator Layer                  │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ Intent Parser│→ │ Prompt       │→ │ LLM Router  │  │
│  │ (extracts    │  │ Builder      │  │ local─→cloud │  │
│  │  domain,     │  │ (fills       │  │ fallback    │  │
│  │  audience,   │  │  framework   │  │             │  │
│  │  tone)       │  │  template)   │  │             │  │
│  └──────────────┘  └──────────────┘  └──────┬──────┘  │
│                                             │         │
│  ┌──────────────────────────────────────────▼───────┐ │
│  │            Framework Templates Registry            │ │
│  │  ┌─────────┐ ┌──────────┐ ┌──────┐ ┌──────────┐ │ │
│  │  │ OpenAI  │ │ Anthropic│ │MPLCT │ │ Karpathy │ │ │
│  │  │ GPT-5.5│ │ Playbook │ │(Video)│ │Principles│ │ │
│  │  └─────────┘ └──────────┘ └──────┘ └──────────┘ │ │
│  │  ┌──────────┐                                     │ │
│  │  │Context   │                                     │ │
│  │  │Engineer- │                                     │ │
│  │  │ing       │                                     │ │
│  │  └──────────┘                                     │ │
│  └────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

## Component Tree

```
Prompter
├── Electron Main Process
│   ├── main.ts           — Window creation, app lifecycle
│   ├── overlay.ts        — AlwaysOnTop management, bounds persistence
│   ├── ipc.ts            — IPC handlers + system tray (LLM, STT, storage)
│   ├── storage.ts        — JSON file persistence (history, encrypted API keys)
│   ├── llm/
│   │   ├── fetch-with-timeout.ts — Shared fetch timeout utility
│   │   ├── ollama.ts     — Ollama client
│   │   ├── openai.ts     — OpenAI client
│   │   └── anthropic.ts  — Anthropic client
│   ├── stt/
│   │   └── whisper.ts    — Whisper STT client
│
└── Renderer Process (React)
    ├── App.tsx
    ├── components/
    │   ├── Bubble.tsx          — Floating bubble (dormant)
    │   ├── BubbleExpanded.tsx  — Expanded card container
    │   ├── InputArea.tsx       — Text input + mic button
    │   ├── MicButton.tsx       — Mic with recording states
    │   ├── OutputPanel.tsx     — Structured prompt display
    │   ├── PromptSection.tsx   — Individual framework section
    │   ├── FrameworkBadge.tsx  — Detected framework indicator
    │   ├── TemplateBrowser.tsx — Template library grid
    │   ├── TemplateCard.tsx    — Individual template
    │   ├── HistoryPanel.tsx    — History list with search
    │   ├── SettingsPanel.tsx   — API keys, model, hotkeys
    │   └── ProcessingOverlay.tsx — Loading/shimmer state
    ├── lib/
    │   ├── frameworks/
    │   │   ├── openai.ts       — OpenAI GPT-5.5 template
    │   │   ├── anthropic.ts    — Anthropic Playbook template
    │   │   ├── mplct.ts        — Video prompt template
    │   │   ├── karpathy.ts     — Karpathy Principles template
    │   │   └── context-eng.ts  — Context Engineering template
    │   ├── templates/
    │   │   ├── index.ts        — Template registry (12 templates)
    │   │   ├── saas-landing.ts
    │   │   ├── cooking-book.ts
    │   │   ├── api-docs.ts
    │   │   ├── agent-prompt.ts
    │   │   └── ... (8 more)
    │   ├── intent-parser.ts    — Raw input → structured data
    │   ├── llm.ts              — IPC bridge to main process (history CRUD included)
    ├── hooks/
    │   └── useBubblePosition.ts — Drag persistence
    └── styles/
        └── globals.css
```

## Data Flow

### Text Input Flow
```
1. User clicks bubble → card expands
2. User types raw intent (e.g., "I need a prompt to create a SaaS landing page for a project management tool")
3. Intent Parser analyzes input:
   - Domain: SaaS
   - Output type: Landing page copy
   - Audience: B2B professionals
   - Tone: Professional, benefit-driven
4. Matches to: OpenAI GPT-5.5 framework + SaaS landing template
5. Framework template filled with parsed data
6. Sent to LLM (Ollama first) for final restructuring
7. Quality check: passes? → Output. Fails? → Retry with cloud API
8. Structured prompt rendered in OutputPanel
9. User copies, edits, or regenerates
```

### Voice Input Flow
```
1. User clicks mic button → recording starts (waveform animation)
2. Audio captured via MediaRecorder API
3. Audio sent to Whisper (local process via IPC)
4. Transcribed text returned → fills InputArea
5. Same flow as Text Input from step 3
```

## Framework Templates

### OpenAI GPT-5.5
```
Role: [function, context, job]
Personality: [tone, demeanor]
Goal: [user-visible outcome]
Success Criteria: [what must be true]
Constraints: [limits, policies]
Output: [sections, length, tone]
Stop Rules: [when to stop/ask]
```

### Anthropic Playbook
```
<role>[function]</role>
<guidelines>...</guidelines>
<policy>...</policy>
<output_contract>[format]</output_contract>
<stop_sequences>...</stop_sequences>
```

### MPLCT (Video Prompts)
```
## SUBJECT
## ENVIRONMENT
## LIGHTING
## CAMERA
## ACTION
## STYLE
## NEGATIVE
## META
```

### Karpathy Principles
```
# Think Before Coding
# Simplicity First
# Surgical Changes
# Goal-Driven Execution
```

### Context Engineering
```
# Context
# Memory
# Skills (SOPs)
# Tools
```

## Template Library

1. **SaaS Landing Page** → OpenAI framework
2. **Cooking Book / Recipe Collection** → OpenAI framework
3. **API Documentation** → OpenAI framework
4. **Agent Instructions / System Prompt** → Anthropic Playbook
5. **Code Review Prompt** → Karpathy Principles
6. **Video Generation** → MPLCT
7. **Blog Post / Article** → OpenAI framework
8. **Customer Support Agent** → Anthropic Playbook + Context Engineering
9. **Data Analysis / Report** → OpenAI framework
10. **UI/UX Design Brief** → OpenAI framework
11. **Product Requirements Doc** → OpenAI framework
12. **Scientific Research Paper** → OpenAI framework

## Design System

- **Colors**: Warm dark glass (`#1C1917` base, `#0F172A` tint)
- **Accent**: Muted steel blue (`#2D4A7A` → `#4A7FA0`)
- **Typography**: Inter (UI), Fraunces (display headings)
- **Radius**: `rounded-2xl` (card), `rounded-full` (bubble)
- **Glass**: `backdrop-blur-2xl` with subtle border (`rgba(255,255,255,0.06)`)
- **Animation**: GSAP clip-path reveals, elastic bounces, staggered fade-ups
- **Mode**: Dark-only (premium tool aesthetic)

## Storage Schema (JSON Files)

### Files

| File | Location | Contents |
|------|----------|----------|
| `prompter-history.json` | `app.getPath('userData')` | Array of `HistoryEntry` — max 500 entries |
| `prompter-keys.json` | `app.getPath('userData')` | Map of service → encrypted API key |

### HistoryEntry Shape

```typescript
interface HistoryEntry {
  id: string;
  rawInput: string;
  structuredOutput: string;
  framework: string;
  template?: string;
  createdAt: string;
}
```

### API Key Storage

Keys are persisted in `prompter-keys.json` using `safeStorage.encryptString()` (Electron's OS-level encryption), base64-encoded. Falls back to base64-only encoding when OS encryption is unavailable.

## Security Considerations

- API keys stored in JSON file (encrypted at rest via `safeStorage` from Electron)
- Mic access only on explicit user action
- Local-first: audio never leaves machine unless cloud LLM is explicitly chosen
- All LLM communication over HTTPS when using cloud APIs
- No telemetry or analytics
