# Task: Fix Electron Transparent Background Issue

## Problem
The Electron window uses `transparent: true` + `backgroundColor: '#00000000'` which was needed for the old 80×80 floating bubble. Now that the bubble is removed and the app is always a 520×520 card, transparency is no longer needed and causes:

1. **Transparent flash on load** — before React hydrates, html/body/#root are all `background: transparent`, showing the desktop through the empty window
2. **GPU crash on Linux** — per-pixel alpha (ARGB8888) requires GPU compositing; crashes on systems without proper GPU support
3. **Sandbox disabled** — `sandbox: false` was needed for transparent compositing, weakening security

## Fix — 3 files to modify

### 1. `src/main/main.ts`
- Remove `transparent: true` from BrowserWindow options
- Change `backgroundColor: '#00000000'` to `backgroundColor: '#18161a'` (the app's surface color)
- Change `sandbox: false` back to `sandbox: true` (no longer need to disable for transparency)
- The `enable-transparent-visuals` CLI flag can remain or be removed (it's a no-op when transparent is false)

Remove the entire comment block:
```
// ── Transparent window fixes ─────────────────────────────
// These command-line switches must be set before app.whenReady().

// Windows: enable-transparent-visuals enables DWM alpha channel
// Linux (X11): enables transparency via X composite extension
if (process.platform === 'win32' || process.platform === 'linux') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
}
```

### 2. `index.html`
- Change `<body class="bg-transparent">` to `<body class="bg-surface">`

### 3. `src/renderer/styles/globals.css`
- Remove lines 86-89: 
```css
html,
body,
#root {
  background: transparent;
}
```
- Change line 93 from:
```css
body {
  font-family: var(--font-sans);
  background: transparent;
```
to:
```css
body {
  font-family: var(--font-sans);
```

## Verification
1. `pnpm typecheck` — 0 errors
2. `pnpm build` — all 3 processes build
3. `pnpm test` — 25/25 passing
4. Launch the app and verify no background flash, no GPU crash
