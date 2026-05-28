# Task: Remove Bubble, Keep Only Main Window

## Goal
Eliminate the 80×80 floating bubble entirely. The app should always show the full 520×520 window (the current BubbleExpanded card). No more bubble ↔ expanded toggle.

## Why
The user explicitly requested: "remove the bubble, keep only the main window, we don't need this bubble."

## Scope of Changes

### Files to DELETE (3 files)
1. `src/renderer/components/Bubble.tsx` (139 lines) — Entire bubble component with pulse animation, drag behavior, context menu
2. `src/renderer/hooks/useBubblePosition.ts` (68 lines) — Drag-to-move-window hook (only Bubble.tsx used it)
3. `src/__tests__/migrate-position.test.ts` (7 lines) — Placeholder test for bubble position (remove the file, it's only a placeholder test)

### Files to MODIFY (8 files)

#### 1. `src/renderer/App.tsx`
Current behavior: conditionally renders `<Bubble />` or `<BubbleExpanded />` based on `isExpanded`, with backdrop overlay, GSAP backdrop animation, window resize logic, and Escape-to-close handler.
New behavior: **always** render `<BubbleExpanded />`. Remove:
- `import { Bubble }` (line 1)
- `isExpanded` check for conditional rendering (line 111)
- Backdrop overlay div (lines 101-109) and its GSAP animation effect (lines 54-87)
- Window resize logic — window is always 520×520, no more resize on expand/collapse (lines 24-40)  
- But **keep** the hotkey listener (lines 13-21) — mic toggle still works
- **Keep** Escape key handler but change it: instead of `setExpanded(false)`, it should call `window.api.window.toggle()` to hide the window
- Remove `bg-transparent` class — always use `bg-surface`
- Remove `import gsap from 'gsap'` — no longer needed in App.tsx
- Remove `useRef` import for backdropRef

#### 2. `src/renderer/stores/app-store.ts`
Remove all bubble/isExpanded state and related methods:
- Remove: `bubbleState: BubbleState` (line 5), `isExpanded: boolean` (line 6)
- Remove: `setBubbleState` (line 12), `setExpanded` (line 14), `toggleExpanded` (line 19)
- Change initial state: remove `bubbleState: 'dormant'` (line 23), `isExpanded: false` (line 24)
- Simplify: `setRecording` should just `set({ isRecording: recording })` (no bubbleState)
- Simplify: `setProcessing` should just `set({ isProcessing: processing })` (no bubbleState)
- Remove import of `BubbleState` from shared/types (line 1)

#### 3. `src/renderer/components/BubbleExpanded.tsx`
This becomes the main window. Changes:
- **Remove** the entrance animation `useEffect` (lines 38-63) — it scales from bottom-right like expanding from a bubble. No longer needed.
- **Change** the close button: currently calls `setExpanded(false)` — now should call `window.api.window.toggle()` to hide the window instead
- The `isExpanded` check at line 46 is gone since we don't have that state; remove the useAppStore destructuring for `setExpanded`
- Add import of useEffect for the window toggle or call inline
- Keep everything else: tabs, body, processing indicator

#### 4. `src/shared/types.ts`
- Remove: `BubbleState` type (line 145)
- Remove: IPC channels for bubble:
  - `BUBBLE_POS_GET: 'bubble:pos:get'` (line 20)
  - `BUBBLE_POS_SET: 'bubble:pos:set'` (line 21)
  - `BUBBLE_WIN_POS_GET: 'bubble:winpos:get'` (line 24)
  - `BUBBLE_WIN_POS_SET: 'bubble:winpos:set'` (line 25)

#### 5. `src/shared/api-types.ts`
- Remove the entire `bubble` section (lines 40-45):
```typescript
bubble: {
  getPosition: () => Promise<{ bottom: number; right: number } | null>;
  setPosition: (pos: { bottom: number; right: number }) => Promise<boolean>;
  getWindowPosition: () => Promise<{ x: number; y: number } | null>;
  setWindowPosition: (pos: { x: number; y: number }) => Promise<boolean>;
};
```

#### 6. `src/preload/index.ts`
- Remove the entire `bubble` section (lines 50-55):
```typescript
bubble: {
  getPosition: () => ipcRenderer.invoke(IPC_CHANNELS.BUBBLE_POS_GET),
  setPosition: (pos: { bottom: number; right: number }) => ipcRenderer.invoke(IPC_CHANNELS.BUBBLE_POS_SET, pos),
  getWindowPosition: () => ipcRenderer.invoke(IPC_CHANNELS.BUBBLE_WIN_POS_GET),
  setWindowPosition: (pos: { x: number; y: number }) => ipcRenderer.invoke(IPC_CHANNELS.BUBBLE_WIN_POS_SET, pos),
},
```

#### 7. `src/main/main.ts`
- Change window from 80×80 bubble to 520×520 main window:
  - Remove `x: screenWidth - 80 - 20, y: screenHeight - 80 - 20` — no longer position bottom-right
  - Change: `width: 520, height: 520` (from `80, 80`)
  - Add: `center: true` for the BrowserWindow options (so it opens centered)
  - Remove: `skipTaskbar: true` — no longer a background widget, should appear in taskbar... actually keep it as alwaysOnTop=true but maybe no skipTaskbar. Let's keep the UI as a legitimate window.
- Remove the `screen` import from 'electron' — no longer need to calculate screen dimensions... actually we still might not need it if we use `center: true`

Wait, let me reconsider. The user said "keep only the main window". This is still an overlay/desktop widget — it should still be always-on-top and a frameless window. But it should behave more like a proper app window now. So:
- Keep: `frame: false, transparent: true, alwaysOnTop: true`
- Remove: `skipTaskbar: true` — it's a main window now, should appear in taskbar
- Keep: `resizable: false` — UI is fixed layout
- Change initial window position from bottom-right to centered

Actually, thinking more about this: since it's still frameless and transparent, and the user might want it to behave as a floating panel they can position where they want, maybe skipTaskbar is fine to keep. But since it's now a "main window" not a "bubble", having it in the taskbar makes sense for discoverability. I'll let the implementer decide or keep a reasonable default.

#### 8. `src/main/ipc.ts`
- Remove saved bubble window position startup block (lines 38-42):
```typescript
// Apply saved bubble window position on startup
const savedWinPos = storage.getBubbleWindowPosition();
if (savedWinPos) {
  setWindowPosition(win, savedWinPos.x, savedWinPos.y);
}
```
- Remove bubble window position IPC handlers (lines 95-103):
```typescript
// ── Bubble Window Position Persistence ──
ipcMain.handle(IPC_CHANNELS.BUBBLE_WIN_POS_GET, () => {
  return storage.getBubbleWindowPosition();
});
ipcMain.handle(IPC_CHANNELS.BUBBLE_WIN_POS_SET, (_event, pos: { x: number; y: number }) => {
  storage.saveBubbleWindowPosition(pos);
  return true;
});
```
- Remove bubble position IPC handlers (lines 154-162):
```typescript
// ── Bubble Position ──
ipcMain.handle(IPC_CHANNELS.BUBBLE_POS_GET, () => {
  return storage.getBubblePosition();
});
ipcMain.handle(IPC_CHANNELS.BUBBLE_POS_SET, (_event, pos: { bottom: number; right: number }) => {
  storage.saveBubblePosition(pos);
  return true;
});
```
- Simplify WINDOW_RESIZE handler (lines 79-87): remove the centering logic comment, just keep `win.setSize(width, height)` since there's no more "expanding" vs "collapsing"
- Also: `registerIpcHandlers` no longer needs to reference `setWindowPosition` from overlay — the bubble window position startup was the only consumer. But keep the import/function since WINDOW_SET_BOUNDS still uses it.

Wait, line 7: `import { setWindowPosition } from './overlay'` — this is used by WINDOW_SET_BOUNDS handler on line 64-66. Keep it.

#### 9. `src/main/storage.ts`
- Remove: `BUBBLE_POS_FILE` constant (line 8), `BUBBLE_WIN_POS_FILE` constant (line 9)
- Remove: `bubblePosPath` (line 17), `bubbleWinPosPath` (line 18) fields
- Remove: initialization of these paths in constructor (lines 26, 28)
- Remove: `getBubblePosition`, `saveBubblePosition` methods (lines 156-174)
- Remove: `getBubbleWindowPosition`, `saveBubbleWindowPosition` methods (lines 178-196)
- Remove the section comments for bubble position (lines 154, 176)

## Summary of Architecture Change
Before: App has two modes — bubble (80×80, always-on-top, transparent) and expanded (520×520, centered, with backdrop). Toggle between them.
After: App is always the 520×520 card. No more toggle. The window hides/shows via system tray or global hotkey (Alt+Space), same as before.

## Verification
After changes:
1. Run `pnpm typecheck` — should pass with zero errors
2. Run `pnpm test` — all existing tests should still pass (remove the bubble placeholder test)
3. Run `pnpm lint` — no errors related to bubble references
4. The app should boot directly to the 520×520 card UI at screen center
