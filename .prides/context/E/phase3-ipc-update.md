# Phase 3: ipc.ts — Dynamic IPC Handlers

## Issue: ISS-0007

## Current State (BAD)
IPC handlers still reference old flat settings fields:
- Line 98: `settings.ollamaEndpoint` for OLLAMA_CHECK
- Line 103: `settings.openaiApiKey` for STT handler
- Missing: PROVIDER_CHECK IPC handler

## What to Do

### 1. Update OLLAMA_CHECK handler (line 96-99):
```typescript
ipcMain.handle(IPC_CHANNELS.OLLAMA_CHECK, async () => {
  const endpoint = (settings as any).providerConfigs?.ollama?.endpoint || 
                   (settings as any).ollamaEndpoint || 
                   'http://localhost:11434';
  return await checkOllamaStatus(endpoint);
});
```

### 2. Update STT handler (line 102-106):
```typescript
ipcMain.handle(IPC_CHANNELS.STT_START, async (_event, audioData: string) => {
  // Check runtime provider configs first, then old flat field for backward compat
  const openaiKey = (settings as any).providerApiKeys?.openai || 
                    (settings as any).openaiApiKey || 
                    storage.getApiKey('openai') || '';
  if (!openaiKey) throw new Error('OpenAI API key not configured for STT');
  return await transcribeAudio(audioData, openaiKey);
});
```

### 3. Add PROVIDER_CHECK handler (insert near other LLM handlers):
```typescript
ipcMain.handle(IPC_CHANNELS.PROVIDER_CHECK, async (_event, providerId: string) => {
  validateService(providerId);
  const engine = createProviderEngine({
    getApiKey: (service: string) => {
      if (service === providerId) {
        // Try to find the key from storage or settings
        return storage.getApiKey(providerId) || (settings as any).providerApiKeys?.[providerId] || null;
      }
      return storage.getApiKey(service) || null;
    },
  });
  const impl = engine['registry']?.getCheck(providerId);
  if (impl) {
    return await impl({ apiKey: storage.getApiKey(providerId) || undefined });
  }
  return { available: false, message: 'Check not implemented for this provider' };
});
```

Wait — let me think about this. The ProviderEngine already has a `check` method, right? Let me check...

Actually, looking at the provider-engine.ts, the `check` method takes `(providerId, opts?)`. But to keep it simple, let me just use the existing infrastructure. The PROVIDER_CHECK handler should:
1. Create/get a ProviderEngine 
2. Call engine.check(providerId, { apiKey })
3. Return the result

But creating a new ProviderEngine each time is wasteful. Let me think...

Better approach: Use the same engine instance that's created in orchestrator.ts. But ipc.ts doesn't currently have access to it.

Simplest approach that works:
```typescript
ipcMain.handle(IPC_CHANNELS.PROVIDER_CHECK, async (_event, providerId: string) => {
  validateService(providerId);
  const { createProviderEngine } = await import('./llm/index');
  const engine = createProviderEngine({
    getApiKey: (service: string) => storage.getApiKey(service) || null,
  });
  return await engine.check(providerId);
});
```

Actually, simpler: just create the ProviderRegistry directly and look up the check function:

Actually, let me reconsider. The engine instance from orchestrator is the one that has the real key store (with in-memory keys). Let me create a simpler approach that uses the storage directly for checks.

OK, let me just keep it straightforward. The check IPC handler creates a temporary engine for the check:

```typescript
ipcMain.handle(IPC_CHANNELS.PROVIDER_CHECK, async (_event, providerId: string) => {
  validateService(providerId);
  const { createProviderEngine } = require('./llm/index');
  const engine = createProviderEngine({
    getApiKey: (service: string) => {
      return storage.getApiKey(service) || (settings as any).providerApiKeys?.[service] || null;
    },
  });
  return await engine.check(providerId);
});
```

## Verification
```bash
pnpm typecheck    # 0 errors
pnpm lint         # 0 errors
pnpm test run     # 25/25 tests
```

## Key Files
- `src/main/ipc.ts` — THIS FILE (to modify)
- `src/shared/types.ts` — IPC_CHANNELS (already has PROVIDER_CHECK)
- `src/main/llm/orchestrator.ts` — config management
