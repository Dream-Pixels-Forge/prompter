# Secure Phase: Security Audit

## Project Overview
**Prompter**: Electron widget (React 19, TypeScript, Vite, Zustand, Tailwind CSS v4)
- Floating prompt architect widget
- 13 LLM providers (Ollama, OpenAI, Anthropic, Groq, DeepSeek, Together, Fireworks, Perplexity, xAI/Grok, Mistral, Gemini, Cohere, OpenRouter)
- Electron with safeStorage for API keys
- IPC between main/renderer processes

## Key Security Concerns

### 1. API Key Storage
- Uses Electron's `safeStorage` for encrypted API key storage
- `src/main/storage.ts` — StorageService handles safeStorage
- Keys are also in-memory in `providerApiKeys` map
- Verify: are keys ever logged? Are they exposed to renderer unencrypted?

### 2. CSP (Content Security Policy)
- Check the current CSP in Electron's BrowserWindow webPreferences
- The app allows `connect-src 'self' http://localhost:11434`
- With 13 cloud providers, CSP needs to be relaxed for their API endpoints
- Verify: CSP is properly configured for each provider's API endpoint

### 3. IPC Security
- `contextBridge` used in preload/index.ts — good practice
- Verify: validateService() properly restricts which providers can be accessed
- Verify: IPC handlers validate input properly
- Verify: no arbitrary IPC channel access

### 4. Provider API Calls
- All calls happen in the main process (not renderer) — good for API key isolation
- Verify: `fetchWithTimeout` has proper error handling
- Verify: no API keys leaked in error messages
- Verify: abort signals propagate properly

### 5. Input Validation
- `validateTextLength` in ipc.ts — checks text max length
- `validateId` in ipc.ts — checks non-empty string
- `validateService` in ipc.ts — checks against PROVIDER_DEFINITIONS
- Verify: all IPC handlers have proper input validation
- Verify: no injection vulnerabilities in prompt generation

### 6. Dependencies
- Check known vulnerabilities in dependencies
- React 19, Electron 39, Vite 6, TypeScript 5

### 7. Electron-specific
- Verify: `nodeIntegration` is false (security best practice)
- Verify: `contextIsolation` is true (security best practice)
- Verify: no dangerous Electron APIs exposed to renderer

## Key Files to Inspect
- `src/main/ipc.ts` — All IPC handlers
- `src/preload/index.ts` — Context bridge
- `src/main/storage.ts` — Encrypted storage
- `src/main/llm/fetch-with-timeout.ts` — HTTP calls
- `src/main/llm/orchestrator.ts` — LLM orchestration
- `src/main/llm/implementations/*.ts` — Provider implementations
- `src/main/index.ts` — Electron main process (BrowserWindow config)
- `index.html` — CSP meta tags
- `package.json` — Dependencies

## Verification
After security audit:
```bash
pnpm typecheck    # 0 errors
pnpm lint         # 0 errors
pnpm test         # 25/25 tests
pnpm build        # clean dist
```

## Output
1. List all security findings (vulnerabilities, risks, misconfigurations)
2. Prioritize: CRITICAL > HIGH > MEDIUM > LOW
3. For each finding, provide a fix
