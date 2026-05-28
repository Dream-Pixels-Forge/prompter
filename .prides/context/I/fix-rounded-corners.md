# Task: Fix Rounded Corners — Transparent Background for Glass Card

## Problem
The base fix removed ALL transparency, replacing it with a solid `backgroundColor: '#18161a'`. This broke the rounded corners of the glass-card — the solid background fills the entire 520×520 window, painting over the 16px border-radius corners.

## Desired Effect
The glass-card has `border-radius: 1rem` (16px). Those 4 corners should be **transparent**, showing the desktop behind the window. The card itself should be opaque.

## Root Cause in Current Code
- `main.ts`: `transparent: false`, `backgroundColor: '#18161a'`, `sandbox: true` — no OS-level transparency
- `App.tsx`: `<div className="... bg-surface">` — solid #18161a covers the entire window
- `globals.css`: `.glass-card` has `background: rgba(24, 22, 26, 0.85)` — semi-transparent, relying on bg-surface underneath
- `index.html`: `<body class="bg-surface">` — solid body background

## Fix — 5 files to modify

### 1. `src/main/main.ts` — Restore transparent window
Restore the transparency settings that were incorrectly removed:
- Add back `transparent: true`
- Change `backgroundColor: '#18161a'` back to `backgroundColor: '#00000000'`
- Change `sandbox: true` back to `sandbox: false`
- Restore the `enable-transparent-visuals` CLI flags for Win/Linux:
```typescript
if (process.platform === 'win32' || process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
}
```

### 2. `src/renderer/App.tsx` — Remove solid background from outer div
The outer div wraps the entire window. Remove `bg-surface` so the corners of the glass-card can show through:
- Change `<div className="w-screen h-screen overflow-hidden select-none bg-surface">` to `<div className="w-screen h-screen overflow-hidden select-none">`

### 3. `src/renderer/styles/globals.css` — Make glass-card fully opaque
The glass-card needs to be FULLY opaque so its body doesn't show the desktop through it. Only the corners (border-radius) should be transparent:
- Change `.glass-card` from:
```css
.glass-card {
  background: rgba(24, 22, 26, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
}
```
to:
```css
.glass-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
}
```
- Remove `backdrop-filter: blur(16px)` — there's nothing behind the card to blur since it fills the window. Removing it also improves performance.

### 4. `index.html` — Remove solid body background
- Change `<body class="bg-surface">` back to `<body>` (no bg class — let the card provide all visuals)

### 5. `src/renderer/styles/globals.css` — Body and root should be transparent
Add back transparent backgrounds for html, body, #root so they don't fill the corner gaps:
```css
html,
body,
#root {
  background: transparent;
}
```

## Visual Chain
```
Desktop (behind window) ← transparent corner gaps (16px radius)
  → Glass-card (opaque #18161a, fills the 520×520 window)
    → Content inside card (tabs, input, settings, etc.)
```

## Verification
1. `pnpm typecheck` — 0 errors
2. `pnpm build` — clean
3. `pnpm test` — 25/25 passing
4. The window corners should be transparent at OS level — rounded corners visible
5. The card body should be fully opaque dark surface (#18161a)
