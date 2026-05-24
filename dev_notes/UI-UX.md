# Prompter — UI/UX Design System

**Version:** 1.0
**Status:** Draft
**Last Updated:** 2026-05-24
**Design Audit:** See `CRITIQUE.md` for code-level issues, `UI-UX.md` for vision and system

---

## Table of Contents

1. [Design Vision](#1-design-vision)
2. [Design Principles](#2-design-principles)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing & Layout](#5-spacing--layout)
6. [Component Design Tokens](#6-component-design-tokens)
7. [Motion & Animation](#7-motion--animation)
8. [Iconography](#8-iconography)
9. [Accessibility](#9-accessibility)
10. [Interaction Patterns](#10-interaction-patterns)
11. [Responsive & Window Strategy](#11-responsive--window-strategy)
12. [Appendix: Implementation Roadmap](#12-appendix-implementation-roadmap)

---

## 1. Design Vision

Prompter is a **creative tool for prompt engineering** — it sits at the intersection of developer tooling and creative expression. The design should communicate:

- **Craft** — prompt engineering is a skill, and the tool should feel precision-made
- **Presence without intrusion** — always accessible, never in the way
- **Generosity** — text should breathe, space should flow, nothing should feel cramped
- **Distinctiveness** — not another generic dark-mode dev tool

### Design Personality

| Axis | Target | Why |
|------|--------|-----|
| Warm vs Cold | Warm | Prompter is a creative partner, not a cold compiler |
| Bold vs Subtle | Bold in key moments | The bubble, the CTA, the framework badges — punchy where it matters |
| Dense vs Generous | Generous | Prompt engineering is about language; text needs room |
| Playful vs Serious | Serious with warmth | This is a professional tool, but it shouldn't feel corporate |
| Conventional vs Distinctive | Distinctive | Must not blend into every other dark-themed utility |

---

## 2. Design Principles

### P1. Content Comes First

Prompter is a text-centric tool. Every layout decision must prioritize readability, scannability, and space for the user's words. If a design choice reduces the amount of visible text, it's the wrong choice.

### P2. Progressive Disclosure

The bubble shows nothing -> click -> shows input -> generate -> shows output. Each state reveals exactly one more layer. Never overwhelm the user with all four tabs at once.

### P3. One Well-Orchestrated Moment

Per DPF-Movematics 2026: one polished, intentional animation (the bubble-to-card expansion) is worth more than a dozen scattered micro-interactions. Motion must have purpose.

### P4. Generous Constraints

The 400px width is currently the single biggest UX problem. Every layout decision is a compromise because there isn't enough room. The card should be wide enough that content isn't fighting for space.

### P5. Accessibility Is Not Optional

Text contrast below WCAG AA is not acceptable. Focus indicators are not optional. Reduced-motion support is not a nice-to-have.

### P6. Brand Through Restraint

The visual identity should come from a **single signature color**, generous typography, and purposeful whitespace — not from decorative flourishes, gradients, or visual noise.

---

## 3. Color System

### 3.1 Brand Palette

Current palette (#2D4A7A / #4A7FA0 on #1C1917) is generic and undersaturated. **This must be replaced** with a distinctive signature color.

#### Proposed Direction: Signature Amber/Copper

| Token | Hex | Role | Usage |
|-------|-----|------|-------|
| `--color-brand` | #D97706 | Primary accent | CTAs, active states, key highlights |
| `--color-brand-dim` | rgba(217, 119, 6, 0.15) | Subtle accent | Tab active bg, badge bg, hover states |
| `--color-brand-emphasis` | #F59E0B | High-energy accent | Hover states, glow effects, mic active |

> **Why Amber/Copper?** Warmth without being aggressive. Distinctive — no major dev tool uses it. Pairs with both dark and light backgrounds. Evokes creativity (amber = warm light, alchemy = prompt transformation).

#### Alternative: Signature Teal

| Token | Hex | Role |
|-------|-----|------|
| `--color-brand` | #0D9488 | Primary accent |
| `--color-brand-dim` | rgba(13, 148, 136, 0.15) | Subtle accent |
| `--color-brand-emphasis` | #14B8A6 | High-energy accent |

> **Why Teal?** Sophisticated, technical, calm. Pairs well with warm neutrals. Underutilized in dev tools.

### 3.2 Surface Colors

| Token | Hex | Current | Issue |
|-------|-----|---------|-------|
| `--color-surface` | #1C1917 | Current | Rich warm dark — keep |
| `--color-surface-light` | #2A2725 | Current | Subtle elevation — keep |
| `--color-surface-lighter` | #322F2D | Current | Too close to surface-light — increase gap to #3A3633 |
| `--color-surface-raised` | #413D39 | Missing | Add for hover states, active cards |
| `--color-surface-overlay` | rgba(0, 0, 0, 0.55) | Hardcoded | Use for overlays |

### 3.3 Semantic Colors

| Token | Hex | Usage | Current State |
|-------|-----|-------|---------------|
| `--color-success` | #34D399 | Success feedback, toast variants | Missing |
| `--color-success-dim` | rgba(52, 211, 153, 0.15) | Success background | Missing |
| `--color-warning` | #FBBF24 | Warnings, limits approaching | Missing |
| `--color-warning-dim` | rgba(251, 191, 36, 0.15) | Warning background | Missing |
| `--color-error` | #F87171 | Errors, destructive actions | Hardcoded as red |
| `--color-error-dim` | rgba(248, 113, 113, 0.15) | Error background | Hardcoded as red-500/15 |
| `--color-info` | #60A5FA | Info banners, connectivity | Missing |

### 3.4 Text Opacity (Accessibility-Corrected)

| Token | Current Opacity | Current Ratio | Target Opacity | Target Ratio |
|-------|----------------|---------------|----------------|--------------|
| `--color-text` | 0.92 | ~8.5:1 Pass | Keep | Keep |
| `--color-text-secondary` | 0.65 | ~5.2:1 Pass | Keep | Keep |
| `--color-text-muted` | 0.38 | ~3.0:1 Fail | **0.55** | ~4.5:1 Pass |
| `--color-text-disabled` | — | — | **0.40** | ~3.2:1 Minimum |
| `--color-text-placeholder` | 0.25 | ~2.0:1 Fail | **0.45** | ~3.5:1 Pass |

### 3.5 Framework Badge Colors

These should be defined as design tokens, not scattered Tailwind classes:

```
Framework: OpenAI        -> emerald
Framework: Anthropic     -> blue
Framework: MPLCT         -> amber
Framework: Karpathy      -> violet
Framework: Context Eng   -> cyan
```

Each badge uses: `bg-[token]-dim text-[token] border-[token]-at-15opacity`

---

## 4. Typography

### 4.1 Current Problems

1. **Scale too compressed** — 10px to 14px across 5 levels (only 4px range)
2. **Inter only** — generic, overused in dev tools
3. **Virtually no hierarchy** — headings, body, and labels differ by 1-2px
4. **10px text used for labels** — too small for readability

### 4.2 Recommended Scale

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `--text-micro` | 10px | 1.3 | 400 | Version, timestamps, legal |
| `--text-tiny` | 11px | 1.4 | 500 | Badges, meta labels |
| `--text-small` | 12px | 1.5 | 400 | Secondary text, descriptions |
| `--text-body` | 13px | 1.6 | 400 | Body text, content |
| `--text-base` | 14px | 1.6 | 500 | Section headers, active tab |
| `--text-md` | 15px | 1.5 | 600 | Panel title, card headers |
| `--text-lg` | 18px | 1.4 | 600 | Output section titles |
| `--text-xl` | 24px | 1.3 | 700 | Empty state hero (rare) |

### 4.3 Font Stack

**Primary UI typeface:** A font with personality that pairs well at both small and medium sizes.

```
Satoshi (or Cabinet Grotesk) -> for headings, labels, and UI elements
Inter                          -> reserved for body text and code-like content
```

Rationale:
- Satoshi/Cabinet Grotesk have distinctive character (low descenders, sharp cuts) that make the UI feel crafted
- Inter performs excellently at small sizes (10-13px) — keep it for body text
- This gives a clear hierarchy through typeface contrast, not just size

### 4.4 Typography Anti-Patterns (Avoid)

- Using `text-[10px]` for anything that conveys information (timestamps only)
- Using `uppercase tracking-wider` on text smaller than 12px
- Using only font-size to create hierarchy (use weight + size + color together)
- Truncating template names — use min-width or horizontal scroll instead

---

## 5. Spacing & Layout

### 5.1 Card Dimensions

**Critical change required:** Expand from 400px to **520px minimum**.

| State | Current | Target | Rationale |
|-------|---------|--------|-----------|
| Collapsed (bubble) | 56x56px | 56x56px | Keep — Fitts's Law adequate |
| Expanded (card width) | 400px | **520-560px** | Content needs room to breathe |
| Expanded (card height) | 560px | **600-640px** | Taller for settings/history |
| Input textarea | 3 rows, max 120px | **4 rows, max 200px** | Prompt engineers write long text |

### 5.2 Spacing Scale

Use a consistent 4px grid:

| Token | Size | Usage |
|-------|------|-------|
| `--spacing-0_5` | 2px | Micro gaps, icon inner spacing |
| `--spacing-1` | 4px | Tight grouping (badge + text) |
| `--spacing-1_5` | 6px | Button icon gaps |
| `--spacing-2` | 8px | Standard gap (space-y-2) |
| `--spacing-2_5` | 10px | Section sub-padding |
| `--spacing-3` | 12px | Card padding, section spacing |
| `--spacing-4` | 16px | Major section separation |
| `--spacing-6` | 24px | Panel edge padding |

### 5.3 Layout Architecture

```
+-------------------------------+
|  +-------------------------+  |  <- Header (48px) - draggable
|  | [Logo] Prompter v0.1 X |  |     gradient accent line at top
|  +-------------------------+  |
|  +-------------------------+  |  <- Tab bar (36px)
|  | Compose | Templates |.. |  |
|  +-------------------------+  |
|  +-------------------------+  |  <- Content area (flex-1)
|  |                         |  |
|  |   [Active tab content]  |  |     scroll-y if overflow
|  |                         |  |
|  +-------------------------+  |
+-------------------------------+
```

---

## 6. Component Design Tokens

### 6.1 Button System

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| Primary | Brand gradient | White | None | Lighter brand |
| Secondary | surface-light | text-secondary | border | surface-lighter |
| Ghost | Transparent | text-muted | None | white/[0.06] |
| Danger | error-dim | error | error-at-30 | darker error-dim |
| Icon | Transparent | text-muted | None | white/[0.08] |

**Minimum target size:** 32x32px for icon buttons, 32px height for text buttons.

### 6.2 Input System

| State | Background | Border | Text |
|-------|-----------|--------|------|
| Default | white/[0.04] | white/[0.08] | text (85%) |
| Focus | white/[0.06] | brand/40 | text (85%) |
| Error | error-dim | error/30 | error |
| Disabled | white/[0.02] | white/[0.04] | text-muted |

### 6.3 Card System

| Layer | Background | Border | Usage |
|-------|-----------|--------|-------|
| Glass (primary) | gradient(surface to surface-light) | white/[0.07] + top highlight | Main expanded card |
| Sub-card | white/[0.03] | white/[0.06] | Nested grouping |
| Raised | surface-raised | white/[0.08] | Hover states, active items |
| Overlay | rgba(0,0,0,0.55) + blur | None | Processing overlay |

### 6.4 Badge System

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| Framework (OpenAI) | emerald-dim | emerald | emerald/15 | Framework badges |
| Framework (Anthropic) | blue-dim | blue | blue/15 | Framework badges |
| Framework (MPLCT) | amber-dim | amber | amber/15 | Framework badges |
| Framework (Karpathy) | violet-dim | violet | violet/15 | Framework badges |
| Framework (Ctx Eng) | cyan-dim | cyan | cyan/15 | Framework badges |
| Neutral | white/[0.05] | text-muted | white/[0.06] | Template domain tags |

### 6.5 Toast System

| Variant | Background | Icon | Duration |
|---------|-----------|------|----------|
| Success | Brand | Check | 2s |
| Error | Error | AlertCircle | 4s (or until dismissed) |
| Info | Info-dim | Info | 3s |

Toast position: bottom-24 (collapsed) / top-4 (expanded) — current behavior is correct.

---

## 7. Motion & Animation

### 7.1 Core Animations

| Animation | Technique | Duration | Easing | Will-Change |
|-----------|-----------|----------|--------|-------------|
| Bubble to Card expansion | GSAP back.out(1.4) | 350ms | Back out | transform, opacity |
| Card to Bubble collapse | GSAP power2.in | 200ms | Power2 in | transform, opacity |
| Backdrop fade in | GSAP power2.out | 250ms | Power2 out | opacity |
| Backdrop fade out | GSAP power2.in | 200ms | Power2 in | opacity |
| Tab content switch | GSAP opacity only | 150ms | Power1 out | opacity |
| Toast entry | GSAP spring | 250ms | Power2 out | transform, opacity |
| Toast exit | GSAP | 200ms | Power2 in | transform, opacity |
| Bubble idle float | GSAP yoyo | 2.5s cycle | Power1 in/out | transform |

### 7.2 Animation Rules

1. **All animations must respect prefers-reduced-motion** — when detected, jump to final state using gsap.set()
2. **No duration exceeds 400ms** — anything slower feels sluggish
3. **One animation at a time** — no competing motion
4. **Will-change is set explicitly** — willChange on animated elements
5. **GSAP context cleanup** — all animations wrapped in gsap.context() with ctx.revert() on unmount

### 7.3 Anti-Patterns (Avoid)

- Layered animate-ping + animate-spin (currently in ProcessingOverlay — too busy)
- Scrolling marquees or parallax (not appropriate for a utility widget)
- Staggered child animations (adds complexity without value)
- Hover animations that cause layout shift

---

## 8. Iconography

### 8.1 Icon Set

Using **Lucide React** — already implemented.

### 8.2 Icon Sizing

| Context | Size | Usage |
|---------|------|-------|
| Navigation tabs | 14x14px (w-3.5) | Tab icons in tab bar |
| Action buttons | 14x14px (w-3.5) | Copy, delete, close |
| Small inline | 12x12px (w-3) | Badge icons, inline indicators |
| Primary CTA | 16x16px (w-4) | Generate button |
| Mic button | 16x16px (w-4) | Voice input toggle |

### 8.3 Icon Opacity

| State | Current Opacity | Target Opacity |
|-------|-----------------|----------------|
| Default (inactive) | 35-40% (too low) | **55%** |
| Hover | 70% | **75%** |
| Active / selected | 90% | **90%** |

---

## 9. Accessibility

### 9.1 Color & Contrast — Critical Fixes

| Element | Current | Target | Status |
|---------|---------|--------|--------|
| Body text | white/85 (85%) | Keep | Pass |
| Secondary text | white/65 (65%) | Keep | Pass |
| Muted text | white/38 (38%) | **Min white/55 (55%)** | Fix required |
| Placeholder text | white/25 (25%) | **Min white/45 (45%)** | Fix required |
| Disabled text | white/35 (35%) | **Min white/40 (40%)** | Fix required |
| Tab inactive text | white/35 (35%) | **Min white/50 (50%)** | Fix required |
| Copy icon (default) | white/40 (40%) | **Min white/55 (55%)** | Fix required |

### 9.2 Focus Indicators

All interactive elements must have visible `:focus-visible` styles:

```css
:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
  border-radius: 4px;
}
```

This must be added globally in globals.css. Current state: **missing entirely**.

### 9.3 Keyboard Navigation

| Action | Current State | Required |
|--------|--------------|----------|
| Tab through card | Works | — |
| Escape to close | Implemented | — |
| Ctrl/Cmd+Enter to generate | Implemented | — |
| Arrow keys in dropdown | Missing | Add aria-listbox pattern |
| Tab order in settings | Works | — |
| Focus trap in expanded card | Missing | Focus should loop within card |

### 9.4 Reduced Motion

All GSAP animations must check:

```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReducedMotion) {
  gsap.to(el, { opacity: 1, y: 0, duration: 0.35 });
} else {
  gsap.set(el, { opacity: 1, y: 0 });
}
```

CSS animations must be disabled:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Current state: **missing entirely**.

### 9.5 Target Sizes

Minimum touch target: 44x44px (WCAG 2.2 SC 2.5.8).

| Element | Current Size | Status |
|---------|-------------|--------|
| Icon buttons (close, copy) | 28x28px (w-7 h-7) | Below minimum |
| Tab buttons | ~80x28px | Width adequate, height needs +4px padding |
| Template cards | ~170px x auto | Adequate |
| History delete button | 28x28px (hover-only) | Below minimum + hidden |

---

## 10. Interaction Patterns

### 10.1 Bubble States

```
DORMANT --click--> EXPANDED
   ^                    |
   +---Escape/click-----+
        outside

DORMANT --hotkey--> EXPANDED (direct to compose)
DORMANT --mic-hotkey--> LISTENING (STT active)
LISTENING --result--> DORMANT (with transcribed text)
PROCESSING --done--> EXPANDED (showing output)
```

### 10.2 Compose Flow

```
1. User types intent
2. Debounced (300ms) intent analysis runs
   -> Framework auto-detected
   -> Template suggested (if match found)
3. User sees framework indicator + optional template badge
4. User presses Ctrl+Enter or Generate
5. Processing state (inline skeleton, not full overlay)
6. Output replaces input area
7. User can copy individual sections or the whole prompt
8. User presses "Back" or "New" to compose again
```

**Key change from current:** Step 5 should show inline skeletons, not a full overlay.

### 10.3 History Flow

```
LIST VIEW:
- Search bar at top (debounced search-as-you-type)
- List of entries with preview text + framework badge + timestamp
- Delete button always visible (not hover-only)

DETAIL VIEW:
- Click entry -> see full input + output
- "Reuse" button loads input back into composer
- "Delete" button with confirmation
- "Back" returns to list
```

### 10.4 Settings Flow

Settings should not auto-save on every keystroke. Patterns:

- **Dropdown/model selection** — instant save (selection confirms choice)
- **API key input** — explicit "Save" button (user control over credentials)
- **Text fields (endpoint, etc.)** — debounced auto-save at 1.5s, with visual indicator

### 10.5 Error Recovery

| Scenario | Current Behavior | Target Behavior |
|----------|-----------------|-----------------|
| LLM generation fails | Inline error in compose tab + toast | Inline error + toast + preserve input |
| STT fails | Toast only | Toast + mic button resets to idle |
| History save fails | Silently swallowed | Toast warning + log to console |
| API key missing | Input area error | Settings tab auto-opens with focus on key field |
| Ollama not running | Check status button | Inline status indicator + suggest start |

---

## 11. Responsive & Window Strategy

### 11.1 Card Width Strategy

| Scenario | Width | Notes |
|----------|-------|-------|
| Default | 520px | Standard expanded view |
| Small screens (<800px wide) | 400px | Shrink to fit (rare for desktop) |
| Large screens (>1440px wide) | 560px | More room for content |
| User-resized | 400-640px | Draggable edge resize |

### 11.2 Multi-Monitor

- Bubble position is relative to the current cursor monitor
- Hotkey opens Prompter on the monitor with the active window
- Position is persisted per-monitor via settings IPC (not localStorage)

### 11.3 Window Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| Overlay (current) | Frameless, transparent, always-on-top | Default — compose while working |
| Floating window | Small chrome, draggable, always-on-top | When user wants minimize/close |
| Docked | Attached to screen edge | Power user mode |

---

## 12. Appendix: Implementation Roadmap

### Phase 1 — Critical Fixes (Now)

| Issue | Effort | Impact |
|-------|--------|--------|
| Fix text contrast across all components | 1-2 days | Highest — legal + usability |
| Add global :focus-visible styles | 15 min | High — keyboard accessibility |
| Add prefers-reduced-motion support | 1-2 hours | High — vestibular safety |

### Phase 2 — Layout Expansion

| Issue | Effort | Impact |
|-------|--------|--------|
| Expand card from 400px to 520px | 30 min | Highest — unlocks everything |
| Increase textarea max-height 120px to 200px | 5 min | High — better compose experience |
| Adjust spacing scale for consistency | 2-4 hours | Medium — visual polish |

### Phase 3 — Design System Implementation

| Issue | Effort | Impact |
|-------|--------|--------|
| Replace hardcoded Tailwind colors with CSS custom properties | 1 day | High — maintainability |
| Add semantic color tokens (success, warning, error, info) | 2-3 hours | Medium — new states |
| Expand typography scale | 1-2 hours | Medium — visual hierarchy |
| Define and apply button/input/card design tokens | 1 day | Medium — consistency |

### Phase 4 — Interaction Polish

| Issue | Effort | Impact |
|-------|--------|--------|
| Replace full overlay with inline skeleton loading | 1-2 days | Medium — perceived performance |
| Make delete buttons always visible | 1 hour | Medium — discoverability |
| Fix compose tab double-duty (add Back affordance) | 2-4 hours | Medium — UX flow |
| Implement debounced search-as-you-type in history | 1-2 hours | Medium — UX polish |

### Phase 5 — Brand Identity

| Issue | Effort | Impact |
|-------|--------|--------|
| Choose and implement signature brand color | 1-2 days | Medium — differentiation |
| Add secondary typeface for headings | 1 day | Medium — personality |
| Consistent icon system sizing + opacity | 2-3 hours | Low — refinement |

---

## Design Review Checklist

Before shipping any UI change, verify:

- [ ] Text contrast meets WCAG AA (4.5:1 body, 3:1 large text)
- [ ] All interactive elements have visible focus indicators
- [ ] Animations respect prefers-reduced-motion
- [ ] Touch targets minimum 32x32px (icon) / 44x44px (primary)
- [ ] No text below 10px for informational content
- [ ] Colors use CSS custom properties, not hardcoded Tailwind classes
- [ ] No hover-only patterns for destructive actions
- [ ] Error states are visible, informative, and actionable
- [ ] Keyboard navigation is logical and complete
- [ ] Changes are consistent with the token system defined above
