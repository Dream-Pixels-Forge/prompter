# Prompter

**A floating desktop widget that transforms raw user intent into production-grade, structured prompts following best practices in prompt engineering.**

Prompter is a system-level floating overlay (inspired by Wispr Flow) that accepts text or voice input and uses an LLM to restructure it into clean, structured prompts using proven frameworks from OpenAI, Anthropic, and more.

<img width="523" height="524" alt="Screenshot from 2026-05-25 05-45-43" src="https://github.com/user-attachments/assets/25c95814-51bf-48c0-96da-853c57e425ec" />



![Status](https://img.shields.io/badge/status-beta-blue)
![Platform](https://img.shields.io/badge/platform-macOS%20|%20Linux%20|%20Windows-lightgrey)
[![CI](https://github.com/Dream-Pixels-Forge/prompter/actions/workflows/ci.yml/badge.svg)](https://github.com/Dream-Pixels-Forge/prompter/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Dream-Pixels-Forge/prompter?include_prereleases)](https://github.com/Dream-Pixels-Forge/prompter/releases)

## Features

- 🫧 **Floating Bubble UI** — Always-on-top, draggable overlay that stays out of your way
- 🎤 **Voice Input** — Speak naturally, get structured prompts back (Web Speech API + Whisper fallback)
- 🧠 **5 Prompt Engineering Frameworks** — OpenAI GPT-5.5, Anthropic Playbook, MPLCT (video/3D), Karpathy Principles, Context Engineering
- 📚 **32 Curated Templates** — 8 per category (Dev, Content, Business, Productivity): MCP Server, Code Review, Agent Instructions, System Architecture, CLI Tool, DB Schema, Test Plan, API Docs, Blog Post, Video Gen, Social Media, Newsletter, SEO Content, Tutorial, Podcast Script, Cooking Book, SaaS Landing, Data Analysis, PRD, Support Agent, Pitch Deck, Product Launch, Email Campaign, Competitor Analysis, UX Brief, Research Paper, Resume, Meeting Notes, Job Posting, Onboarding Guide, Legal/Policy Docs, Cover Letter
- 🔄 **Hybrid LLM** — Local first (Ollama), cloud fallback (OpenAI/Anthropic)
- 🔒 **Encrypted API Key Storage** — Electron safeStorage with base64 fallback
- 📋 **One-Click Copy** — Copy structured prompts to clipboard instantly
- 🔍 **History & Search** — JSON-file history with search, delete, clear, and reuse
- 🔥 **Global Hotkeys** — Alt+Space toggle, Alt+M mic toggle
- 🖥️ **System Tray** — Quick access from system tray
- ✨ **GSAP Animations** — Smooth bubble transitions and entrance effects
- 📦 **Packaged Releases** — AppImage (Linux), DMG (macOS), NSIS (Windows)

## Download

### Linux
```bash
curl -L -o Prompter.AppImage https://github.com/Dream-Pixels-Forge/prompter/releases/latest/download/Prompter-0.2.0.AppImage
chmod +x Prompter.AppImage
./Prompter.AppImage
```

Or install the `.deb`:
```bash
curl -L -o prompter.deb https://github.com/Dream-Pixels-Forge/prompter/releases/latest/download/Prompter-0.2.0-amd64.deb
sudo dpkg -i prompter.deb
```

### macOS
Download the latest `.dmg` from the [releases page](https://github.com/Dream-Pixels-Forge/prompter/releases).

### Windows
Download the latest `-Setup.exe` from the [releases page](https://github.com/Dream-Pixels-Forge/prompter/releases).

---

<img width="525" height="525" alt="Screenshot from 2026-05-25 05-44-50" src="https://github.com/user-attachments/assets/3c68a2c2-539f-4494-ab30-e9d09d879e03" />


## Built with PRIDES Methodology

Prompter was developed using the **PRIDES** software development methodology — a structured six-phase workflow designed for AI-assisted development:

| Phase | What It Means | What We Built |
|---|---|---|
| **P**rototype | Ideas, requirements, PRD, architecture plan | Concept docs, ARCHITECTURE.md, tech stack decisions |
| **R**eview | Code inspection, critical feedback, git setup | Repository structure, CI/CD pipeline, code quality gates |
| **I**mplement | 6 incremental delivery phases | See below — every feature shipped iteratively |
| **D**eploy | CI/CD, build config, packaging | GitHub Actions matrix build, electron-builder, AppImage release |
| **E**xtend | Scalability, plugin architecture | Modular framework/template system, IPC abstraction layer |
| **S**ecure | Security audits, hardening | contextIsolation, sandbox, safeStorage encryption, CSP |

<img width="526" height="525" alt="Screenshot from 2026-05-25 05-57-57" src="https://github.com/user-attachments/assets/38f492c1-b2dc-45c1-aa06-5065125affbe" />


### Implementation Phases

| Phase | Scope | Key Deliverables |
|---|---|---|
| **1** — Core Foundation | Scaffolding | Electron + React + Vite + Tailwind, 3 frameworks, 3 templates, LLM orchestrator, 11 components |
| **2** — LLM Integration | Providers | Ollama (local), OpenAI, Anthropic providers, settings UI, streaming, provider selection |
| **3** — Voice Input | Speech | Web Speech API, MicButton with recording states, OpenAI Whisper fallback |
| **4** — Full Frameworks | Templates | MPLCT + Context Engineering frameworks, 9 more templates (12 total), template→framework mapping |
| **5** — Persistence | Storage | JSON-file history, safeStorage encrypted API keys, history browser, system tray |
| **6** — Polish & Release | Finish | GSAP animations, glassmorphism, Alt+M hotkey, inline errors, first AppImage release |

Each phase followed a strict **Verify → Review → Document → Push** cycle before advancing.

## Quick Start

```bash
# Install dependencies
pnpm install

# Development
pnpm dev

# Build (Vite only, no packaging)
pnpm build

# Package for distribution
pnpm dist:linux   # AppImage + .deb
pnpm dist:mac     # .dmg (ARM64 + x64)
pnpm dist:win     # NSIS installer (x64)
pnpm dist         # All platforms
```

## Requirements

- Node.js 18+
- pnpm 9+
- [Ollama](https://ollama.ai) (optional, for local LLM)
- macOS 12+ / Windows 10+ / Linux (X11/Wayland)

## Documentation

- [PRIDES Methodology](PRIDES.md)
- [Architecture](dev_notes/ARCHITECTURE.md)
- [Task Tracking](dev_notes/TASKS.md)
- [Progress](dev_notes/PROGRESS.md)
- [Changelog](dev_notes/CHANGELOG.md)

## License

MIT © Dream Pixels Forge

---

## Built With

This project was crafted using [Dream Pixels Forge (DPF)](https://github.com/Dream-Pixels-Forge) tools:
- **[dpf-publisher-engineer](https://github.com/Dream-Pixels-Forge/dpf-publisher-engineer)** — Release automation, CI/CD publishing, and distribution
- **dpf-electron-engineer** — Electron app architecture, IPC, and native integrations
- **dpf-frontend-senior** — Production-grade React + TypeScript architecture
- **dpf-gsap-master** — GSAP animation system for bubble UI and transitions
- **dpf-movematics** — Motion design system for UI/UX micro-interactions
- **dpf-senior-tailwindcss-designer** — Tailwind CSS v4 design system with glassmorphism
