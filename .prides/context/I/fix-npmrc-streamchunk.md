# Task: Remove Dead Code and Stale Config

## Part 1: Fix `.npmrc`
File: `.npmrc` (project root)

Remove npm-only flags that are ignored by pnpm:
- `auto-install-peers=true` — npm config, ignored by pnpm
- `shamefully-hoist=true` — npm config, ignored by pnpm

The `.npmrc` should only contain pnpm-relevant config.

## Part 2: Remove Dead `StreamChunk` Interface
File: `src/shared/types.ts`

Lines 97-101:
```typescript
export interface StreamChunk {
  type: 'chunk' | 'done' | 'error';
  text?: string;
  error?: string;
}
```

This interface has ZERO consumers — stream functions were removed in a prior refactor. Remove it entirely.

## Verification
- `pnpm typecheck` — 0 errors
- `pnpm test` — all passing
