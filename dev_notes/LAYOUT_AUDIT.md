# Layout & Alignment Audit Report

> Generated: 2026-05-23
> Methodology: Systematic Debugging (4-Phase)
> Scope: Full widget layout review — Electron window, React components, CSS/styling

---

## 🔴 CRITICAL ISSUES

### Issue 1: Expanded Card Width (420px) Exceeds Window Width (360px)

**Files:** `src/main/main.ts:10` + `src/renderer/components/BubbleExpanded.tsx:62`

**Root Cause:** Window is created at `width: 360` in main.ts, but the expanded card is `w-[420px]` — 60px wider than the window. Card is `fixed bottom-4 right-4`, left edge = `344 - 420 = -76px`, clipping ~76px of content off-screen.

**Impact:** ALL content inside the expanded card is asymmetrically cropped on the left — header, tabs, compose, templates, history, settings panels all shift rightward.

### Issue 2: Bubble Dual Positioning — `bottom/right` + `transform: translate()`

**File:** `src/renderer/components/Bubble.tsx:36`

**Root Cause:** Uses both `bottom: 24px; right: 24px` (CSS anchor) AND `transform: translate(${position.x}px, ${position.y}px)` (drag offset). Default position `{x: -20, y: -80}` from `useBubblePosition` means visual location = `bottom: 104px, right: 44px`. The drag system stores translate offsets, not absolute positions, making it dependent on CSS `bottom`/`right` not changing.

---

## 🟠 MODERATE ISSUES

### Issue 3: Toast Overlaps Expanded Card Space

**Files:** `src/renderer/components/Toast.tsx:27`

**Root Cause:** Toast at `bottom-24` (96px from bottom) hovers in the same vertical zone as the expanded card (`bottom-4`, ~464px tall). Toast text can be partially obscured by or obscure the lower portion of the card.

### Issue 4: `ProcessingOverlay` z-index (40) Collides with Backdrop z-index (40)

**Files:** `ProcessingOverlay.tsx:3`, `App.tsx:65`

**Root Cause:** Both use `z-40`. ProcessingOverlay is inside card at `z-50`, so its stacking context isolates it — but brittle if the overlay needs to appear above something else at z-50.

### Issue 5: HistoryPanel Scrollable List `max-h-[380px]` Exceeds Available Space

**File:** `src/renderer/components/HistoryPanel.tsx:156`

**Root Cause:** Available space in card body ≈ 250px (after header 58px + tabs 40px + padding 28px + search bar 88px). But `max-h-[380px]` claims 130px more, causing container overflow.

### Issue 6: TemplateCard Grid Lacks Equal-Height Row Control

**Files:** `TemplateBrowser.tsx:39`, `TemplateCard.tsx:13`

**Root Cause:** `grid grid-cols-2 gap-2` without `auto-rows-fr`. Cards with `h-full` in a row can have different heights if their content lengths differ.

### Issue 7: InputArea Textarea Max-Height at 180px Too Large

**File:** `src/renderer/components/InputArea.tsx:35`

**Root Cause:** 180px = ~37% of 480px window. After header, tabs, and bottom bar, expanding textarea pushes other elements below visible area.

### Issue 8: No Window Frame But No Drag Region

**File:** `src/main/main.ts:12`

**Root Cause:** `frame: false` removes title bar, but no `-webkit-app-region: drag` exists anywhere. User cannot reposition the Electron window.

---

## 🟡 MINOR ISSUES

### Issue 9: MicButton Visual Imbalance in Bottom Bar
**File:** `InputArea.tsx` — 44px button with 16px inner icon creates 28px padding asymmetry.

### Issue 10: Settings API Key Grid Column Mismatch
**File:** `SettingsPanel.tsx:152` — 3-column grid (`80px_1fr_auto`) vs FormRow 2-column (`80px_1fr`).

### Issue 11: `ml-auto` + `flex-wrap` Interaction in History Detail
**File:** `HistoryPanel.tsx:88-96` — Wrapping `ml-auto` date pushes to right edge on new line.

### Issue 12: No GPU Animation Hints
**Files:** `Bubble.tsx`, `BubbleExpanded.tsx`, `Toast.tsx` — GSAP animations lack `will-change` hints in transparent Electron window.

### Issue 13: Content Assumes Full Card Width (388px) But Only ~284px Visible
**File:** `BubbleExpanded.tsx:62` — Card width 420px minus 32px padding = 388px, but only ~284px visible after 76px clipping.

### Issue 14: Hover Scale (1.10) + Drag Initiation Conflict
**File:** `Bubble.tsx:43` — `hover:scale-110` fires on mousedown before drag starts, causing perceived visual jump.

---

## 🔵 TRIVIAL ISSUES

### Issue 15: TemplateBrowser Icon Name Map is Brittle
**File:** `TemplateBrowser.tsx:7-20` — String-based icon mapping silently falls back to Sparkles.

### Issue 16: Toast z-index (50) Same as Card (50)
**File:** `Toast.tsx:27` — No stacking protection when both are visible.

---

## Priority Order for Fixes

1. **CRITICAL:** Fix window width to accommodate 420px card (or reduce card width)
2. **CRITICAL:** Fix bubble positioning to use absolute coords instead of translate+css anchor
3. **MODERATE:** Fix HistoryPanel max-h to match available space
4. **MODERATE:** Add window drag region for frameless window
5. **MODERATE:** Fix z-index stacking for overlay/backdrop
6. **MODERATE:** Fix Toast positioning to avoid card overlap
7. **MODERATE:** Add auto-rows-fr to template grid
8. **MINOR:** Add will-change to animated elements
9. **MINOR:** Remaining visual polish items
