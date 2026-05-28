# Task: Update SECURITY.md to Reflect Actual Implementation

## Problem
`SECURITY.md` (in the project root) was written as a draft/design document v1.0. It references many things that don't match the actual codebase.

### What SECURITY.md says (wrong):
- SQLite database for storage (actual: JSON files with `fs.writeFileSync`)
- Relies on `better-sqlite3` dependency (actual: no SQLite at all)
- `session.defaultSession.webRequest.onBeforeRequest` blocking lists (not implemented)
- `ELECTRON_HTTPS_ONLY`, `disable-ntp`, `no-proxy-server` flags (not in main.ts)
- References to external entitlement files and OS-specific hardening that don't exist
- Mentions `contentSecurityPolicy` config object (actual: CSP is in `index.html` as a `<meta>` tag)
- States CSP allows `https://api.openai.com` (actual: CSP in index.html does NOT — it restricts to `'self'` and `http://localhost:11434`)

### What's ACTUALLY implemented (should say):
- Storage: JSON files (`history.json`, `keys.json`, `settings.json`) in `app.getPath('userData')`
- API key encryption: Electron `safeStorage.encryptString/decryptString` with base64 encoding
- CSP in `index.html` as `<meta>` tag: restricts to `'self'` + `http://localhost:11434` (Ollama)
- Electron security: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: false` (for transparent window)
- IPC: typed channel names with input validation handlers
- No network requests beyond LLM APIs (Ollama localhost, OpenAI, Anthropic)
- System tray for show/hide/quit
- Global hotkeys: Alt+Space (toggle), Alt+M (mic)
- No telemetry, analytics, or crash reporting

## Instructions
Rewrite SECURITY.md to match the ACTUAL implementation. Remove aspirational/design sections. Keep the same structure but make it accurate. Move any aspirational content to `dev_notes/security-design.md` if it's worth keeping.

## Verification
- The file should be roughly shorter than before (removing unimplemented sections)
- Should describe what the app ACTUALLY does, not what it COULD do
