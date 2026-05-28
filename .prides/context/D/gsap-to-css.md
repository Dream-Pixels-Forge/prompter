# Replace GSAP with CSS Animations

## Current State
GSAP (6.4 MB) is imported in 2 files for trivial entrance animations that CSS can handle with @keyframes — already partially implemented in globals.css.

## Files to Modify

### 1. src/renderer/components/BubbleExpanded.tsx
Current: Line 4 `import gsap from 'gsap';`
Current: Lines 37-44 — GSAP fade on tab switch:
```ts
useEffect(() => {
  if (prefersReduced()) return;
  const body = bodyRef.current;
  if (!body) return;
  gsap.fromTo(body, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: 'power1.out', willChange: 'opacity' });
}, [activeTab]);
```
Required:
- Remove `import gsap from 'gsap'` (line 4)
- Remove `gsap.fromTo` call
- Remove `prefersReduced()` function (line 13) — no longer needed for this
- Toggle a CSS animation class on bodyRef to trigger a 150ms fade-in when activeTab changes
- Use a React key or a class toggle approach

Add CSS class in globals.css:
```css
@keyframes tab-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.tab-fade-in {
  animation: tab-fade-in 0.15s ease-out forwards;
}
```

In the component, change the useEffect to:
```ts
useEffect(() => {
  const body = bodyRef.current;
  if (!body) return;
  body.classList.remove('tab-fade-in');
  // Force reflow
  void body.offsetWidth;
  body.classList.add('tab-fade-in');
}, [activeTab]);
```

Or use a state-based class approach. The key is: no GSAP dependency.

### 2. src/renderer/components/Toast.tsx
Current: Line 2 `import gsap from 'gsap';`
Current: Lines 13-18 — GSAP entrance animation
Current: Lines 21-24 — GSAP exit animation

Required:
- Remove `import gsap from 'gsap'`
- Replace GSAP entrance with CSS class `toast-enter` (already defined in globals.css!)
- Replace GSAP exit with CSS class `toast-exit` (already defined in globals.css!)
- Keep the same timer-based lifecycle (2s visible, then hide)
- The `toast-enter` and `toast-exit` animations already exist in globals.css:
  - toast-in: 0.2s ease-out, translateY(-8px → 0), opacity(0 → 1)
  - toast-out: 0.15s ease-in, translateY(0 → -8px), opacity(1 → 0)

Use a state approach: mount with toast-enter class, after 2s switch to toast-exit, then call hideToast after animation completes.

### 3. package.json
Remove `"gsap": "^...",` from dependencies

### 4. pnpm-lock.yaml
Will auto-update when running `pnpm install` after removing gsap

### 5. Verification
- pnpm typecheck — 0 errors
- pnpm test — all 25 tests pass
- pnpm lint — 0 errors
- pnpm build — clean

## Design Intent
- The tab fade is subtle: 150ms opacity fade. No transform, no scale — just a gentle fade.
- The toast already has CSS animations ready in globals.css. Just wire them up.
- Both animations respect prefers-reduced-motion via the existing CSS media query.
- No visual regression from the GSAP versions.
