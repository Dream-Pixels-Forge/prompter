# Performance Quick Fixes

## ISS-0002: 300ms Startup Delay

### File: src/main/main.ts
Current line 47:
```ts
setTimeout(() => {
  createWindow();
  if (!mainWindow) return;
  registerIpcHandlers(mainWindow);
}, 300);
```

Required: Change 300 → 0:
```ts
setTimeout(() => {
  createWindow();
  if (!mainWindow) return;
  registerIpcHandlers(mainWindow);
}, 0);
```

This eliminates the artificial 300ms cold-start delay. Use 0 instead of removing setTimeout entirely to yield to the event loop before window creation.

## ISS-0003: Enable Minification

### File: vite.config.ts
Current (lines 21 and 41):
```ts
minify: false,
```

Required (both the main and preload configs):
```ts
minify: 'esbuild',
```

Changing from false to 'esbuild' reduces main.js by ~44% (32KB → 18KB).

## ISS-0004: Font Conversion (TTF → WOFF2)

### Font Files
Location: `assets/fonts/`
Files:
- Inter-Regular.ttf
- Inter-Medium.ttf
- Inter-SemiBold.ttf
- Inter-Bold.ttf

### CSS File: src/renderer/styles/globals.css
Current (lines 3-26):
```css
@font-face {
  font-family: "Inter";
  font-weight: 400;
  font-display: swap;
  src: url("/assets/fonts/Inter-Regular.ttf") format("truetype");
}
```

Required: Convert each TTF to WOFF2.

Steps:
1. Check if `woff2_compress` CLI is available, OR
2. Install `@mozilla/ttf2woff2` package and use a conversion script
3. Convert all 4 TTF files to WOFF2
4. Update globals.css @font-face src URLs to reference .woff2 files
5. Keep TTF files as fallback (add `format('woff2'), url(...) format('truetype')`)

If conversion tooling isn't readily available, skip this task and report it.

### Verification
- pnpm typecheck — 0 errors
- pnpm test — all 25 tests pass
- pnpm lint — 0 errors
- pnpm build — clean, verify bundle sizes reduced
