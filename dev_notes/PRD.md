# Prompter — Product Requirements Document

**Version:** 1.0
**Status:** Draft
**Last Updated:** 2026-05-23

---

## 1. Product Overview

Prompter is a desktop floating overlay widget that transforms raw user intent into structured, best-practice prompts for large language models. It lives as a small draggable bubble hovering above all windows — always accessible, never in the way. Users type or speak what they want (e.g., "I need a prompt to create a SaaS landing page"), and Prompter applies proven prompt engineering frameworks to produce a polished, ready-to-use output.

The product exists because the gap between a user's intent and a well-crafted prompt is wide. Most users — including developers and AI professionals — write prompts from scratch each time, inconsistently applying best practices across different LLMs and frameworks. Prompter closes this gap by embedding expert knowledge into the tool itself: five prompt engineering frameworks, a library of pre-built templates, and a hybrid local/cloud LLM pipeline that works offline by default and upgrades quality on demand.

The result is a tool that makes every interaction with an LLM more effective. Users stop writing prompts and start describing outcomes. Prompter handles the structure, the framework selection, and the formatting — so the user can focus on what they actually want to achieve.

---

## 2. Problem Statement

**Raw intent is ambiguous.** When a user types "write a blog post about AI", the LLM has no context for tone, audience, structure, constraints, or success criteria. The output is generic and requires multiple rounds of refinement.

**Writing good prompts is hard.** Effective prompting requires knowledge of frameworks — role assignment, output contracts, chain-of-thought, constraint specifications — that most users don't have memorized. Even experienced prompt engineers switch between frameworks inconsistently.

**Context switching kills flow.** Users tab between a hundred tools — browser, IDE, terminal, notes — to craft a prompt, paste it into ChatGPT or Claude, then copy the result somewhere else. There is no dedicated surface for prompt composition that lives at the system level.

**Voice input is underused in prompting.** Speech-to-text for prompt composition is powerful but requires yet another tool. Users who think faster than they type have no ergonomic way to dictate prompts into their LLM workflow.

Prompter solves all of these by providing a single, always-available surface for prompt construction that sits above every window, understands multiple frameworks, accepts voice input, and produces structured output ready to copy and use.

---

## 3. Target Users

### Alex — The Developer / AI Engineer
Alex builds agentic systems and writes dozens of system prompts per week. He needs precise control over framework structure — Karpathy principles for agent instructions, Anthropic playbook for XML-tagged prompts, context engineering for multi-file agent definitions. He works in full-screen terminals and IDEs and needs a tool that stays accessible without breaking focus. He runs Ollama locally for sensitive code and falls back to OpenAI for complex prompts.

### Maya — The Content Creator
Maya generates structured prompts for AI image and video tools daily. She needs templates for video generation prompts (MPLCT framework with camera direction, lighting, temporal flow), blog post outlines, and social media copy. She often dictates ideas via microphone while reviewing reference material. She values speed and simplicity — she does not want to think about which framework to use.

### Sam — The Prompt Engineer
Sam's entire job is prompt optimization. He iterates on prompts for enterprise clients, A/B tests framework variations, and maintains a library of proven prompts. He needs history search, framework comparison, the ability to edit outputs in place, and quick regeneration with different parameters. He is the power user who will customize every setting and expects keyboard-first operation.

---

## 4. User Stories

1. As a user, I want to click a floating bubble to expand it into the input view, so I can start composing a prompt instantly from any application.
2. As a user, I want to type my raw intent into a textarea and press Enter to generate a structured prompt, so I don't need to know prompt engineering techniques.
3. As a user, I want to tap a microphone button and speak my intent, so I can compose prompts hands-free when I'm thinking faster than I can type.
4. As a user, I want Prompter to automatically detect the most suitable framework for my intent, so I don't have to choose manually.
5. As a user, I want to select from 12+ pre-built templates (e.g., "SaaS Landing Page", "Code Review", "Video Generation"), so I can start from a known structure.
6. As a user, I want to copy the generated prompt to my clipboard with one click, so I can immediately paste it into my LLM of choice.
7. As a user, I want to regenerate a prompt with different parameters, so I can explore variations without retyping my intent.
8. As a user, I want to browse my prompt history sorted by recency, so I can find and reuse prompts I created earlier.
9. As a user, I want to search my history by keywords, so I can quickly locate a specific prompt from hundreds of entries.
10. As a user, I want to configure API keys, select my preferred LLM model, customize hotkeys, and switch themes in a settings panel, so the tool works my way.

---

## 5. Feature Requirements

### 5.1 Floating Bubble

| Feature | Detail |
|---|---|
| States | **Dormant** — small pill (~60x32px) showing logo or icon. **Active** — expanded when hovered or clicked, showing a thin input bar. **Listening** — pulsing animation when mic is active. **Processing** — subtle spinner while LLM generates |
| Drag | Click and drag the bubble anywhere on screen. Position persists across sessions via localStorage. Snaps to screen edges on release (optional) |
| Auto-hide | Bubble fades to 30% opacity after 5 seconds of inactivity. Full opacity on hover or system-wide hotkey |
| Always-on-top | Window is `alwaysOnTop: true` with `skipTaskbar: true`. Transparent background with no title bar or borders |
| Click behavior | Single click expands to input view (320px wide panel). Click outside or Escape collapses back to bubble |

### 5.2 Input

| Feature | Detail |
|---|---|
| Textarea | Multi-line textarea with placeholder: *"Describe what you want a prompt for... (e.g., 'a prompt to build a REST API docs page')"* |
| Voice toggle | Microphone icon button. Toggles Whisper STT on/off. Shows waveform animation when active |
| Character count | Live counter below textarea. Soft limit at 1000 chars, hard limit at 5000 chars with warning |
| Submit | Ctrl+Enter or click Generate button. Disabled while processing |
| Framework indicator | Badge showing auto-detected framework. Clickable to override manually |

### 5.3 Framework Engine

**Auto-detection logic:**
- Intent contains video/image keywords (camera, lighting, scene, render, cinematic) → MPLCT
- Intent contains agent/instruction keywords (agent, tool, function, system, behavior) → Karpathy Principles
- Intent contains document/contract keywords (API, docs, specification, XML, contract) → Anthropic Playbook
- Intent mentions code, review, or architecture → Karpathy Principles or OpenAI GPT-5.5
- Default fallback → OpenAI GPT-5.5 structure (Role, Context, Goal, Constraints, Output Format)

**Five framework templates stored as prompt engineering configurations:**

1. **OpenAI GPT-5.5** — Role, Personality, Goal, Success Criteria, Constraints, Output Format, Stop Rules
2. **Anthropic Playbook** — XML-tagged sections (`<role>`, `<context>`, `<objective>`, `<rules>`, `<output>`), output contracts with required fields
3. **MPLCT** — Material, Physics, Lighting, Camera, Temporal sections for video/3D generation prompts
4. **Karpathy Principles** — Think first, Simplicity, Surgical Changes, Goal-Driven, Define Success Criteria
5. **Context Engineering** — Context folder path, Memory references, Skills/SOPs, Tool definitions, Instructions

**Manual override:** Dropdown in expanded view lets user pick any framework regardless of auto-detection.

### 5.4 Output Panel

| Feature | Detail |
|---|---|
| Display | Rendered with syntax highlighting for section headers, XML tags, and code blocks within the prompt |
| Copy button | One-click copies entire generated prompt to clipboard. Shows brief "Copied!" toast |
| Edit in place | Output text is editable — user can tweak sections before copying |
| Regenerate | Button regenerates output with same input but new LLM inference (useful for exploring variations) |
| Section collapse | Long outputs have collapsible sections for navigation |
| Framework badge | Shows which framework was used for generation |

### 5.5 Template Library

| # | Template Name | Description | Auto-mapped Framework |
|---|---|---|---|
| 1 | SaaS Landing Page | Prompt for generating a landing page with hero, features, pricing, CTA | OpenAI GPT-5.5 |
| 2 | Cooking Book Recipe | Structured recipe with ingredients, steps, tips, nutrition | Anthropic Playbook |
| 3 | API Documentation | Endpoint-by-endpoint doc with request/response examples | Anthropic Playbook |
| 4 | Agent Instructions | System prompt for an AI agent with tools and constraints | Karpathy Principles |
| 5 | Code Review | Review prompt with security, perf, style, correctness checklist | OpenAI GPT-5.5 |
| 6 | Video Generation | Camera direction, lighting, materials, temporal sequencing | MPLCT |
| 7 | Blog Post | Outline-to-full-post with tone, audience, SEO, structure | OpenAI GPT-5.5 |
| 8 | Customer Support Agent | Agent instructions with escalation paths, tone guardrails | Context Engineering |
| 9 | Data Analysis | Analysis prompt with dataset description, questions, output format | OpenAI GPT-5.5 |
| 10 | UI/UX Brief | Design brief with user flows, components, states, edge cases | Anthropic Playbook |
| 11 | PRD | Product requirements with problem, users, stories, specs | OpenAI GPT-5.5 |
| 12 | Research Paper | Paper outline with abstract, methodology, lit review, results | Karpathy Principles |

### 5.6 History

| Feature | Detail |
|---|---|
| Storage | SQLite via better-sqlite3, stored at `~/.promptforge/history.db` |
| Schema | `id (UUID), raw_input (text), generated_prompt (text), framework (string), template (nullable string), created_at (ISO timestamp)` |
| List | Sorted by `created_at DESC`, paginated 20 per page. Shows preview of input and first 100 chars of output |
| Search | Full-text search across `raw_input` and `generated_prompt` fields. Debounced at 300ms |
| Re-use | Click a history entry to load its input back into the composer |
| Delete | Swipe or right-click to delete individual entries. "Clear all" in settings |

### 5.7 Settings

| Section | Fields |
|---|---|
| API Keys | OpenAI key (encrypted-at-rest), Anthropic key (encrypted-at-rest), Ollama URL (default `http://localhost:11434`) |
| Model Selection | Preferred provider (Ollama / OpenAI / Anthropic), model name per provider, fallback order |
| Hotkeys | Global toggle (default `Alt+Space`), Mic toggle (default `Alt+M`), Quick capture (default `Alt+C`) |
| Theme | Light / Dark / System |
| General | Launch on startup toggle, auto-hide delay slider, bubble position reset |
| Data | Export all history (JSON), clear history, clear settings |

API keys are encrypted using `safeStorage` from Electron's main process. Decrypted only in-memory when making API calls.

### 5.8 System Tray

| Feature | Detail |
|---|---|
| Icon | Custom tray icon matching app state (idle / processing) |
| Context menu | Open Prompter, Toggle Mic, Start Quick Capture, Recent History (last 5), Settings, Quit |
| Minimize to tray | Closing window minimizes to tray instead of quitting. Configured in settings |

---

## 6. User Flow

The user is working in their IDE when they realize they need a well-structured prompt for a code review. They press `Alt+Space` — the global hotkey — and the Prompter bubble appears at the bottom-right of their screen. They click the bubble, which expands into a clean, minimal panel with a textarea. The bubble's dormant state transitioned to active in under 200ms with a subtle GSAP scale-and-fade animation.

The user types "Review a Pull Request for a React component that uses useEffect and useCallback. Focus on memory leaks, unnecessary re-renders, and missing cleanup." They notice the framework badge auto-detected "OpenAI GPT-5.5" — correct. They press Ctrl+Enter. The bubble transitions to its processing state with a gentle spinner animation. In about 800ms (local Ollama), the output panel slides in below the input, showing a structured prompt with Role ("Senior React Reviewer"), Goal, Success Criteria (no memory leaks, correct dependency arrays), Constraints (React 19, functional components), and Output Format (issues grouped by severity).

The user reads through the output, tweaks the Success Criteria section inline, and clicks Copy. A brief "Copied!" toast confirms. They paste directly into their LLM chat and receive a thorough code review. They close the panel with Escape; the bubble returns to dormant. Later that day, they search history for "code review" and find the same session to regenerate with a different framework for comparison.

---

## 7. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Response time | <500ms for local inference (Ollama), <2000ms for cloud (OpenAI/Anthropic) |
| Bubble animation | All transitions complete within 200ms |
| Startup time | <1.5s from cold start to tray icon visible |
| Memory footprint | <80MB idle, <200MB during inference |
| Disk usage | <50MB for app, history DB grows <10MB/year for average user |
| Privacy | All voice processing done locally via Whisper. API calls to cloud LLMs only when user-configurable. History stored locally only |
| Offline capability | Full functionality with Ollama. Cloud features gracefully disabled when offline |
| Input latency | STT transcription completes within 1.5x real-time on modern hardware |
| Concurrency | Single-user desktop app. No multi-user or server requirements |

---

## 8. Out of Scope for V1

- **Plugin system** — No third-party framework or template extensions. Frameworks and templates are hardcoded for v1
- **Cloud sync** — No history sync across machines. No cloud account required
- **Mobile version** — Desktop-only (macOS, Windows, Linux). No iOS or Android
- **Browser extension** — No Chrome/Firefox extension. The Electron overlay covers browser use
- **Multi-language output** — English only for v1. Framework templates are English-structured
- **Collaboration** — No sharing, team workspaces, or multi-user features
- **Custom framework builder** — Users cannot define their own frameworks in v1. Selection is limited to the 5 built-in frameworks
- **LLM chat interface** — Prompter is a prompt composer, not a chat client. Users copy output to their preferred LLM

---

## 9. Release Criteria

1. Bubble renders as a transparent, frameless, always-on-top Electron window with correct drag behavior
2. Text input captures intent and generates a structured prompt via a local LLM (Ollama)
3. At least 2 of 5 frameworks produce correct, complete outputs (OpenAI GPT-5.5 and Karpathy Principles)
4. At least 6 of 12 templates produce usable outputs when selected
5. Voice input captures audio, transcribes via Whisper, and populates the textarea
6. History saves, lists, searches, and re-loads entries without data loss
7. Copy button copies generated prompt to system clipboard
8. Settings panel persists API keys (encrypted), model selection, and hotkey configuration
9. System tray minimizes and restores application state
10. Global hotkey (`Alt+Space`) toggles bubble visibility
11. Application launches, exits, and re-launches without crashes on macOS and Windows
12. Memory stays under 200MB during sustained use (10+ prompt generations)
13. No unhandled errors in main or renderer process during normal operation

---

## 10. Success Metrics

| Metric | Target |
|---|---|
| Daily Active Users (DAU) | >100 within 30 days of public release |
| Prompts generated per user per day | >5 average |
| Template usage rate | >40% of prompts use a template |
| Voice input adoption | >15% of users use voice at least once per session |
| History re-use rate | >20% of prompts generated from history re-use |
| Time-to-first-prompt | <10 seconds from install to first generated output |
| User retention (7-day) | >60% return within 7 days of first use |
| Copy rate | >80% of generated prompts are copied to clipboard |
| Framework auto-detection accuracy | >85% correct on first attempt |
| NPS (Net Promoter Score) | >40 in first post-launch survey |

---

## 11. Appendix

### Framework Reference

Each framework configuration defines:
- **Sections** — ordered list of sections to generate (e.g., `["Role", "Context", "Goal", "Constraints", "Output"]`)
- **Section prompts** — instructions to the LLM for generating each section
- **Formatting rules** — Markdown, XML, or structured text for the output
- **Section descriptions** — tooltip-level explanations shown in the output panel

Frameworks are stored as TypeScript configuration objects in `src/lib/frameworks/` and are extensible without schema changes for v1.

### Glossary

| Term | Definition |
|---|---|
| **Prompt** | The structured text output that users paste into an LLM |
| **Intent** | The user's raw, unstructured description of what they need |
| **Framework** | A structured approach to prompt construction (e.g., OpenAI GPT-5.5, Anthropic Playbook) |
| **Template** | A pre-configured intent + framework combination optimized for a specific use case |
| **Bubble** | The floating UI element that is the primary entry point |
| **STT** | Speech-to-Text, powered by local Whisper |
