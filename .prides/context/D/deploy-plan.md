# Deploy Plan — Prompter Widget

## Current State
- Phase: D (Deploy)
- Branch: main (current HEAD 0e868a1)
- Uncommitted changes: bubble removal, 13 lint fixes, GPU crash fix, rounded corners fix, SECURITY.md rewrite, dead code cleanup
- Typecheck: 0 errors
- Lint: 0 errors (80 files)
- Tests: 25/25 passing (4 suites)
- Build: clean (renderer 2.04s, main 94ms, preload 44ms)
- Remote: git@github.com:Dream-Pixels-Forge/prompter.git

## CI Config
- `.github/workflows/ci.yml`: 3 job types across 3 OSes (ubuntu, macos, windows)
  - quality: typecheck + pnpm audit (ubuntu-latest)
  - build: install + build (3 OSes)
  - test: install + test (3 OSes)
- Node 24, pnpm 11

## Dist Config
- `electron-builder.yml`: Multi-platform
  - macOS: dmg + zip (arm64 + x64)
  - Windows: nsis installer (x64)
  - Linux: AppImage + deb (x64)
- Output: `release/` directory
- Publishing: GitHub Releases (draft)

## Tasks
1. Commit current changes (bubble removal round)
2. Push to GitHub main branch
3. Verify CI quality job passes (typecheck, audit)
4. Run dist build locally for linux (AppImage + deb)
5. Verify dist artifacts exist in release/
6. Performance audit (bundle size, startup time, memory)

## Verification Criteria
- [ ] `git push` → CI triggers on main
- [ ] CI quality job: typecheck + audit pass
- [ ] CI build job: builds clean on ubuntu-latest
- [ ] `pnpm build` + `pnpm dist:linux` produces AppImage + deb
- [ ] Release artifacts present in `release/`
