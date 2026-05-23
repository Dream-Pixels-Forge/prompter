# PromptForge

**A floating desktop widget that transforms raw user intent into production-grade, structured prompts following best practices in prompt engineering.**

PromptForge is a system-level floating overlay (inspired by Wispr Flow) that accepts text or voice input and uses an LLM to restructure it into clean, structured prompts using proven frameworks from OpenAI, Anthropic, and more.

![Status](https://img.shields.io/badge/status-alpha-blue)
![Platform](https://img.shields.io/badge/platform-macOS%20|%20Linux%20|%20Windows-lightgrey)

## Features

- 🫧 **Floating Bubble UI** — Always-on-top, draggable overlay that stays out of your way
- 🎤 **Voice Input** — Speak naturally, get structured prompts back (Whisper-powered)
- 🧠 **Multi-Framework Support** — OpenAI GPT-5.5, Anthropic Playbook, MPLCT, Karpathy Principles, Context Engineering
- 📚 **12+ Curated Templates** — SaaS landing pages, cooking books, API docs, agent instructions, video prompts, and more
- 🔄 **Hybrid LLM** — Local first (Ollama), cloud fallback (OpenAI/Anthropic) for quality
- 📋 **One-Click Copy** — Copy structured prompts to clipboard instantly
- 🔍 **History & Search** — Every transformation saved locally

## Quick Start

```bash
# Install dependencies
pnpm install

# Development
pnpm dev

# Build
pnpm build
```

## Requirements

- Node.js 18+
- pnpm 8+
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
