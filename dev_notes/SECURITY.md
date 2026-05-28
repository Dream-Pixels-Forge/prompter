# Prompter — Security Architecture

**Version:** 2.0
**Status:** Living
**Last Updated:** 2026-05-28

---

## Table of Contents

1. [Threat Model](#1-threat-model)
2. [Security Architecture](#2-security-architecture)
3. [Data Flow Security](#3-data-flow-security)
4. [Secure Configuration](#4-secure-configuration)
5. [API Key Management](#5-api-key-management)
6. [Privacy Guarantees](#6-privacy-guarantees)
7. [Dependency Security](#7-dependency-security)
8. [Build & Distribution Security](#8-build--distribution-security)
9. [Security Checklist](#9-security-checklist)

---

## 1. Threat Model

### 1.1 Assets to Protect

| Asset | Sensitivity | Location |
|---|---|---|
| OpenAI API key | Critical | Encrypted in JSON (`prompter-keys.json`) + in-memory during use |
| Anthropic API key | Critical | Encrypted in JSON (`prompter-keys.json`) + in-memory during use |
| Prompt history (raw_input + generated_output) | Medium | JSON at `{userData}/prompter-history.json` |
| Audio recordings | Medium | In-memory during transcription, discarded immediately |
| Settings/preferences | Low | JSON at `{userData}/prompter-settings.json` |
| Ollama URL | Low | JSON at `{userData}/prompter-settings.json` (localhost-only by default) |

### 1.2 Threat Actors

| Actor | Capability | Motivation |
|---|---|---|
| **Casual malware** | File reads, process memory dumps, keylogging | Steal API keys for resale or usage |
| **Local attacker** | Physical or remote access to user's machine | Extract credentials, read prompt history |
| **Network adversary** | Passive eavesdropping, active MITM on unencrypted connections | Intercept API calls, inject responses |
| **Supply chain attacker** | Compromise of npm dependencies | RCE, data exfiltration via compromised package |
| **Malicious extension/addon** | Access to Electron renderer process | Execute arbitrary JS in renderer context |

### 1.3 Threat Scenarios

#### T1: API Key Exfiltration
- **Scenario:** Malware reads `prompter-keys.json` and extracts OpenAI/Anthropic keys
- **Mitigation:** Keys encrypted with Electron `safeStorage.encryptString` (OS-level encryption). Key material never stored in plaintext on disk. Decryption happens in main process only, in-memory, for the duration of a request.

#### T2: Unauthorized Microphone Access
- **Scenario:** Renderer process compromised, attacker activates mic without user action
- **Mitigation:** Mic activation requires explicit IPC call from renderer (`stt:start`). Audio captured in renderer via `navigator.mediaDevices.getUserMedia`, sent to main process as base64-encoded data, forwarded to OpenAI Whisper API. No persistent audio stream in main process.

#### T3: MITM on Cloud LLM Calls
- **Scenario:** Network attacker intercepts HTTP traffic during OpenAI/Anthropic API calls
- **Mitigation:** All cloud API calls use HTTPS with certificate validation. No HTTP fallback. Renderer cannot make direct network requests — all LLM calls go through main process IPC.

#### T4: Local Data Exposure
- **Scenario:** Another application on the same machine reads JSON storage files
- **Mitigation:** API keys are encrypted at rest via `safeStorage`. History data is not encrypted (performance tradeoff), but relies on OS file permissions on `app.getPath('userData')`. No `fs.chmod` calls are made — standard user-directory permissions apply.

#### T5: IPC Injection
- **Scenario:** Renderer sends spoofed IPC messages to main process
- **Mitigation:** Context isolation enabled. Preload script exposes a strict typed API via `contextBridge.exposeInMainWorld('api', ...)`. Input validation on IPC arguments (service name validation, text length checks). All IPC channels use typed constant names from `IPC_CHANNELS` in `src/shared/types.ts`.

#### T6: Supply Chain Attack
- **Scenario:** Compromised npm package (direct or transitive) executes malicious code
- **Mitigation:** Lockfile (`pnpm-lock.yaml`) committed to repository. CI uses `--frozen-lockfile`. Dependencies reviewed manually at addition. Electron's context isolation limits damage from renderer-process code execution.

---

## 2. Security Architecture

### 2.1 Electron Security Configuration

```
┌──────────────────────────────────────────────────────────────┐
│                    Operating System                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Electron Main Process                       │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  safeStorage (OS keychain/macOS Keychain/        │  │  │
│  │  │   Windows DPAPI/Linux libsecret)                 │  │  │
│  │  │  - encryptString(plaintext) → base64 string      │  │  │
│  │  │  - decryptString(base64) → plaintext             │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  IPC Handlers (validated, typed)                 │  │  │
│  │  │  │  llm:generate       → LLM orchestration       │  │  │
│  │  │  │  stt:start          → mic transcription       │  │  │
│  │  │  │  store:getApiKey    → decrypt + return        │  │  │
│  │  │  │  store:saveApiKey   → encrypt + persist       │  │  │
│  │  │  │  settings:get/set   → read/write settings     │  │  │
│  │  │  │  history:*          → CRUD history entries    │  │  │
│  │  │  │  window:*           → window management       │  │  │
│  │  │  │  clipboard:write    → clipboard write         │  │  │
│  │  │  │  ollama:check       → Ollama health check     │  │  │
│  │  │  │  hotkey:triggered   → hotkey events           │  │  │
│  │  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  LLM Clients (main process only)                 │  │  │
│  │  │  │  Ollama    → http://localhost:11434            │  │  │
│  │  │  │  OpenAI    → https://api.openai.com            │  │  │
│  │  │  │  Anthropic → https://api.anthropic.com         │  │  │
│  │  │  │  All cloud APIs use HTTPS with cert validation │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  JSON File Storage (in userData)                 │  │  │
│  │  │  │  prompter-history.json — prompt history        │  │  │
│  │  │  │  prompter-keys.json    — encrypted API keys    │  │  │
│  │  │  │  prompter-settings.json — app settings         │  │  │
│  │  │  │  Keys encrypted via safeStorage.encryptString   │  │  │
│  │  │  │  History/settings in plaintext                  │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Renderer Process (contextIsolated)          │  │
│  │  │  contextIsolation: true                             │  │  │
│  │  │  nodeIntegration: false                             │  │  │
│  │  │  sandbox: false (required for transparent window)   │  │  │
│  │  │                                                     │  │  │
│  │  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  │  preload/index.ts (exposed API)              │  │  │
│  │  │  │  │  window.api = {                           │  │  │
│  │  │  │  │    llm.generate(req)                      │  │  │
│  │  │  │  │    clipboard.write(text)                  │  │  │
│  │  │  │  │    window.setBounds/toggle/resize/pos     │  │  │
│  │  │  │  │    settings.get/set                       │  │  │
│  │  │  │  │    ollama.check()                         │  │  │
│  │  │  │  │    stt.transcribe(audioData)              │  │  │
│  │  │  │  │    history.insert/list/search/delete/clear│  │  │
│  │  │  │  │    store.saveApiKey/getApiKey             │  │  │
│  │  │  │  │    hotkey.onTriggered(cb)                 │  │  │
│  │  │  │  │    app.quit()                             │  │  │
│  │  │  │  │  }                                        │  │  │
│  │  │  └──────────────────────────────────────────────┘  │  │
│  │  │                                                     │  │
│  │  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  │  React 19 App (Zustand for state)            │  │  │
│  │  │  │  │  CSP restricts: script-src, connect-src   │  │  │
│  │  │  │  │  connect-src allows localhost:11434       │  │  │
│  │  │  │  │  All LLM calls via IPC → main process     │  │  │
│  │  │  └──────────────────────────────────────────────┘  │  │
│  │  └────────────────────────────────────────────────────┘  │
│  └──────────────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Key Security Settings

```typescript
// src/main/main.ts — BrowserWindow creation
const mainWindow = new BrowserWindow({
  width: 520,
  height: 520,
  frame: false,
  transparent: true,
  backgroundColor: '#00000000',
  alwaysOnTop: true,
  resizable: false,
  webPreferences: {
    preload: path.join(__dirname, '../preload/index.js'),
    contextIsolation: true,       // CRITICAL: isolate renderer from Node
    nodeIntegration: false,       // CRITICAL: no Node in renderer
    sandbox: false,               // REQUIRED: transparent window compositing
  },
});
```

### 2.3 IPC Channel Allowlist

All IPC communication goes through typed constant names defined in `src/shared/types.ts`. The renderer **cannot** send arbitrary IPC messages — only the channels exposed via `contextBridge` are available.

```typescript
// src/preload/index.ts — strict typed API
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  llm: {
    generate: (req: GenerateRequest) =>
      ipcRenderer.invoke('llm:generate', req),
  },
  clipboard: {
    write: (text: string) =>
      ipcRenderer.invoke('clipboard:write', text),
  },
  window: {
    setBounds: (bounds) => ipcRenderer.invoke('window:setBounds', bounds),
    toggle: () => ipcRenderer.invoke('window:toggle'),
    resize: (w, h) => ipcRenderer.send('window:resize', w, h),
    getPosition: () => ipcRenderer.invoke('window:pos:get'),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (s) => ipcRenderer.invoke('settings:set', s),
  },
  ollama: {
    check: () => ipcRenderer.invoke('ollama:check'),
  },
  stt: {
    transcribe: (audioData: string) =>
      ipcRenderer.invoke('stt:start', audioData),
  },
  history: {
    insert: (entry) => ipcRenderer.invoke('history:insert', entry),
    list: (limit, offset) => ipcRenderer.invoke('history:list', limit, offset),
    search: (query) => ipcRenderer.invoke('history:search', query),
    delete: (id) => ipcRenderer.invoke('history:delete', id),
    clear: () => ipcRenderer.invoke('history:clear'),
  },
  store: {
    saveApiKey: (service, key) =>
      ipcRenderer.invoke('store:saveApiKey', service, key),
    getApiKey: (service) =>
      ipcRenderer.invoke('store:getApiKey', service),
  },
  hotkey: {
    onTriggered: (callback) => {
      const handler = (_event, action) => callback(action);
      ipcRenderer.on('hotkey:triggered', handler);
      return () => ipcRenderer.removeListener('hotkey:triggered', handler);
    },
  },
  app: {
    quit: () => ipcRenderer.invoke('app:quit'),
  },
});
```

### 2.4 IPC Handler Validation (Main Process)

Every IPC handler validates input before processing:

```typescript
// src/main/ipc.ts — input validation pattern
const VALID_SERVICES = new Set(['openai', 'anthropic']);

function validateService(service: string): void {
  if (!VALID_SERVICES.has(service)) {
    throw new Error(`Invalid service: must be one of [${[...VALID_SERVICES].join(', ')}]`);
  }
}

function validateTextLength(text: string, max = 100000): void {
  if (typeof text !== 'string' || text.length > max) {
    throw new Error(`Invalid text: must be a string with max ${max} characters`);
  }
}

ipcMain.handle('store:saveApiKey', (_event, service: string, apiKey: string) => {
  validateService(service);
  validateTextLength(apiKey, 4096);
  storage.saveApiKey(service, apiKey);
  return true;
});
```

---

## 3. Data Flow Security

### 3.1 API Key Lifecycle

```
User enters API key in Settings UI
         │
         ▼
Renderer → IPC ('store:saveApiKey', 'openai', 'sk-...')
         │
         ▼
Main Process validates provider + key format
         │
         ▼
safeStorage.encryptString(plaintextKey) → encrypted string
         │
         ▼
Buffer.from(encrypted).toString('base64') → stored in prompter-keys.json
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ At Rest: Base64-encoded ciphertext in JSON file      │
│ Protected by OS keychain (DPAPI/libsecret/Keychain)  │
│ File location: {userData}/prompter-keys.json         │
└─────────────────────────────────────────────────────┘

--- Later, when LLM call is made ---

Renderer → IPC ('llm:generate', payload)
         │
         ▼
Main Process reads encrypted key from prompter-keys.json
         │
         ▼
safeStorage.decryptString(base64Buffer) → plaintext key
         │
         ▼
Plaintext key used ONLY for this request's HTTP headers
         │
         ▼
After request completes → key reference released (GC eligible)
         │
         ▼
Key never written to disk, never persisted in renderer
```

### 3.2 Microphone Access Flow

```
User clicks Mic button in renderer
         │
         ▼
Renderer calls navigator.mediaDevices.getUserMedia({ audio: true })
         │
         ▼
Audio recorded in renderer → converted to base64 data
         │
         ▼
Renderer calls api.stt.transcribe(audioData)
         │
         ▼
IPC → Main Process:
  - Retrieves OpenAI API key from encrypted storage
  - Sends audio data to OpenAI Whisper API
  - Returns transcribed text to renderer
         │
         ▼
On completion:
  - Audio stream closed in renderer
  - Audio buffers released in main process
  - Audio data is NEVER written to disk
  - Audio data is NEVER sent except to OpenAI Whisper API
```

### 3.3 LLM Invocation Flow

```
Renderer sends IPC ('llm:generate', { input, framework, template? })
         │
         ▼
Main Process LLM Orchestrator (src/main/llm/orchestrator.ts):
  ┌─ 1. Validate framework exists
  ├─ 2. Select provider (Ollama / OpenAI / Anthropic)
  ├─ 3. If cloud provider:
  │     ├─ Read API key from active config (decrypted earlier)
  │     ├─ Construct HTTPS request (TLS)
  │     ├─ Set Authorization header
  │     ├─ Send request
  │     └─ Key is removed from scope after request
  ├─ 4. If Ollama (local):
  │     ├─ Connect to configured endpoint (default: http://localhost:11434)
  │     └─ Send HTTP request
  └─ 5. Return structured result to renderer
         │
         ▼
Result sent via IPC response (never containing API keys)
```

### 3.4 History Storage

```
User generates prompt
         │
         ▼
LLM result returned to renderer
         │
         ▼
Main Process saves to JSON (prompter-history.json):
  - rawInput (plaintext) — user's own text
  - structuredOutput (plaintext) — generated prompt
  - framework, template, timestamp
         │
         ▼
History is stored in:
  - File: {userData}/prompter-history.json
  - In-memory array capped at 500 entries
  - Written via queued writes (write-after-write ordering enforced)
```

---

## 4. Secure Configuration

### 4.1 Content Security Policy (CSP)

```html
<!-- index.html -->
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline';
    connect-src 'self' http://localhost:11434;
    img-src 'self' data:;
  "
/>
```

**Rationale per directive:**

| Directive | Why |
|---|---|
| `default-src 'self'` | Baseline — only same-origin resources by default |
| `script-src 'self'` | No inline scripts. All JS from bundle only |
| `style-src 'self' 'unsafe-inline'` | Tailwind CSS injection requires inline styles. Acceptable because context isolation prevents DOM manipulation from injected scripts |
| `connect-src 'self' http://localhost:11434` | Renderer may connect to local Ollama server directly. **No direct connections to cloud LLM APIs** — those go through main process IPC |
| `img-src 'self' data:` | App icons and inline image data only |

### 4.2 BrowserWindow Hardening

```typescript
// src/main/main.ts — window hardening
mainWindow.webContents.on('closed', () => {
  mainWindow = null;
});

// Prevent navigation away from app — handled implicitly by loadFile/loadURL usage
// No will-navigate handler: the app uses hash-based navigation from Vite dev server
// or file:// protocol in production. External URLs cannot be navigated to because
// loadURL is only called with the dev server URL or file:// path.
```

### 4.3 Network Access

Network requests originate only from the main process:

| Endpoint | Protocol | Purpose | Allowed |
|---|---|---|---|
| `http://localhost:11434` | HTTP | Ollama API calls | Yes (localhost only) |
| `https://api.openai.com` | HTTPS | OpenAI LLM + Whisper API | Yes (main process only) |
| `https://api.anthropic.com` | HTTPS | Anthropic LLM API | Yes (main process only) |
| All other destinations | — | — | No |

No CLI switches for HTTPS enforcement exist. The renderer CSP blocks direct connections. Cloud API calls in the main process use HTTPS URLs directly (Ollama client uses the user-configured endpoint, defaulting to `http://localhost:11434`).

### 4.4 Transparent Window Considerations

The window uses `sandbox: false` because Chromium's sandbox interferes with transparent window compositing on some platforms. The following mitigations compensate:

- `contextIsolation: true` — renderer cannot access Node.js APIs
- `nodeIntegration: false` — no `require()` in renderer
- CSP restricts script execution to bundled code only
- Preload script exposes a strict typed API — no generic `ipcRenderer.send` access

On Windows and Linux, `enable-transparent-visuals` is set as a command-line switch to enable DWM alpha channel / X composite extension. On Linux, GPU acceleration is disabled (`disable-gpu`) to avoid GPU process crashes.

---

## 5. API Key Management

### 5.1 Encryption Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  Electron safeStorage                         │
│                                                               │
│  Platform-specific backends:                                  │
│  • macOS: Keychain (kSecAttrAccessibleWhenUnlockedThisDeviceOnly)│
│  • Windows: DPAPI (CryptProtectData)                          │
│  • Linux: libsecret (Secret Service API via D-Bus)            │
│                                                               │
│  safeStorage.isEncryptionAvailable() → check before use       │
│                                                               │
│  encryptString(plaintext: string) → Buffer                    │
│  decryptString(buffer: Buffer) → string                       │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Storage Schema

```json
// prompter-keys.json — stored at {userData}/prompter-keys.json
{
  "openai": "<base64_encoded_ciphertext>",
  "anthropic": "<base64_encoded_ciphertext>"
}
```

### 5.3 Implementation

```typescript
// src/main/storage.ts — API key encryption
import { safeStorage } from 'electron';

export class StorageService {
  saveApiKey(service: string, apiKey: string): void {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error(
        'System encryption unavailable — cannot securely store API key. ' +
        'Run in an environment with safeStorage support (macOS, Windows, or Linux with a keyring).',
      );
    }
    const encrypted = safeStorage.encryptString(apiKey);
    keys[service] = encrypted.toString('base64');
    fs.writeFileSync(this.keysPath, JSON.stringify(keys, null, 2), 'utf-8');
  }

  getApiKey(service: string): string | null {
    const keys: Record<string, string> = JSON.parse(
      fs.readFileSync(this.keysPath, 'utf-8'),
    );
    const stored = keys[service];
    if (!stored || !safeStorage.isEncryptionAvailable()) return null;
    return safeStorage.decryptString(Buffer.from(stored, 'base64'));
  }
}
```

### 5.4 Key Handling Rules

1. **Never store plaintext keys** — Keys are encrypted before first write to `prompter-keys.json`
2. **Decrypt only in main process** — Renderer never receives plaintext keys
3. **Decrypt on demand** — Keys are decrypted per-request, then reference is released
4. **No key caching** — Decrypted keys are not cached in memory beyond active config object
5. **No console logging** — API keys are never logged
6. **No error message leakage** — API errors redact the key from error messages
7. **safeStorage must be available** — The app throws if `safeStorage.isEncryptionAvailable()` is false (no fallback)

### 5.5 Key Validation

```typescript
// src/main/ipc.ts — service name validation
const VALID_SERVICES = new Set(['openai', 'anthropic']);

function validateService(service: string): void {
  if (!VALID_SERVICES.has(service)) {
    throw new Error(`Invalid service: must be one of [${[...VALID_SERVICES].join(', ')}]`);
  }
}
```

---

## 6. Privacy Guarantees

### 6.1 What Prompter Does NOT Do

| Activity | Status | Guarantee |
|---|---|---|
| Telemetry / analytics | ❌ NONE | No tracking, no analytics SDK, no metrics collection |
| Crash reporting | ❌ NONE | No Sentry, no crash reporter, no error upload |
| User behavior tracking | ❌ NONE | No mouse movement, click tracking, or heatmaps |
| Prompt history upload | ❌ NONE | All history stays in local JSON files |
| Audio recording upload | ❌ NONE | Audio sent only to OpenAI Whisper API for transcription |
| Advertising | ❌ NONE | No ads, no ad SDKs |
| Third-party tracking | ❌ NONE | No Google Analytics, Facebook Pixel, or similar |
| Auto-update | ❌ NONE | No auto-updater implemented |
| License validation | ❌ NONE | No phone-home license checks |

### 6.2 What Prompter Does

| Activity | Detail | Privacy Implication |
|---|---|---|
| Cloud LLM calls | User's intent text sent to OpenAI/Anthropic API | User must consent by configuring API key and selecting cloud provider |
| Ollama calls | User's intent text sent to local Ollama server | All traffic on localhost, never leaves machine |
| History storage | Raw input + generated prompt saved to local JSON | Stored locally, user can delete at any time |
| STT transcription | Audio sent to OpenAI Whisper API (if configured) | Sent to OpenAI for processing when using cloud STT |

---

## 7. Dependency Security

### 7.1 npm Audit Policy

```ini
.npmrc
audit=true
audit-level=high
```

### 7.2 Dependency Rules

| Rule | Policy |
|---|---|
| Lockfile | `pnpm-lock.yaml` committed to repository. CI uses `--frozen-lockfile` |
| Exact versions | All dependencies pinned to exact versions in `package.json` |
| Minimum dependencies | Review every dependency. No unnecessary transitive dependencies |
| Native modules | None — all dependencies are pure JS/TS |
| Dev dependencies | Not included in production build (electron-builder filters dev deps) |
| Known vulnerabilities | Zero tolerance for `HIGH` or `CRITICAL` in production dependencies |

### 7.3 Approved Dependency Review

Before adding a new dependency, evaluate:

1. Is it necessary? (Could we write 20 lines instead?)
2. Is it maintained? (Updated within last 6 months, regular releases)
3. Is it popular? (>1000 stars or >100k weekly downloads)
4. Is it secure? (No known CVEs, no suspicious `postinstall` scripts)
5. Does it need native bindings? (Prefer pure JS/TS)
6. Does it need network access? (Should not in renderer)

### 7.4 Current Dependencies

| Package | Role | Notes |
|---|---|---|
| `electron` | Desktop runtime | Latest stable. Critical security updates tracked |
| `react` / `react-dom` ^19.0.0 | UI framework | Latest major |
| `zustand` ^5.0.0 | State management | Lightweight, no Redux |
| `gsap` ^3.12.0 | Animations | Client-side only |
| `lucide-react` ^0.400.0 | Icons | Pure SVG icons |
| `tailwindcss` ^4.0.0 | Styling | Dev dependency, CSS-only |
| `vite` ^6.0.0 | Bundler | Dev dependency |
| `electron-builder` | Distribution | Dev dependency, no code signing configured |

---

## 8. Build & Distribution Security

### 8.1 Current Status

| Platform | Code Signing | Status |
|---|---|---|
| macOS | ❌ Not configured | electron-builder present but no signing config |
| Windows | ❌ Not configured | electron-builder present but no signing config |
| Linux | N/A | AppImage — no signing required |

### 8.2 Build Pipeline

```yaml
# Build pipeline steps (in package.json scripts)
1. pnpm typecheck    # TypeScript type safety
2. pnpm lint         # Biome linting
3. pnpm test         # Vitest test suite
4. pnpm build        # Vite production build
5. pnpm dist:mac     # electron-builder (macOS AppImage/dmg)
   pnpm dist:win     # electron-builder (Windows NSIS)
   pnpm dist:linux   # electron-builder (Linux AppImage)
```

### 8.3 Release Artifact Verification

Users can verify downloaded releases:

```bash
# macOS
shasum -a 256 Prompter-*.dmg
# Windows
certutil -hashfile Prompter-Setup-*.exe SHA256
# Linux
sha256sum Prompter-*.AppImage
```

---

## 9. Security Checklist

### Current Implementation Status

- [x] **contextIsolation: true** — verified in `src/main/main.ts`
- [x] **nodeIntegration: false** — verified in `src/main/main.ts`
- [ ] **sandbox: true** — `sandbox: false` (required for transparent window)
- [x] CSP meta tag present in `index.html` with all directives
- [x] IPC channels are validated (service names, text lengths) in main process
- [x] API keys encrypted with `safeStorage.encryptString` before writing to JSON
- [x] API keys never logged, included in error messages, or sent to renderer
- [x] Mic activation requires explicit user action (click event)
- [x] Audio data not persisted to disk
- [x] Cloud LLM calls use HTTPS with certificate validation
- [x] Renderer CSP blocks direct network access to non-Ollama endpoints
- [x] Lockfile (`pnpm-lock.yaml`) committed
- [x] No analytics, telemetry, or crash reporting SDKs in dependencies
- [x] No dev dependencies included in production build

### Areas for Future Improvement

- [ ] Enable `sandbox: true` (requires non-transparent window or alternative compositing)
- [ ] macOS code signing and notarization
- [ ] Windows code signing
- [ ] CSP `form-action 'none'` directive
- [ ] `navigateOnDragDrop: false` hardening
- [ ] Permission checks on IPC origin (verify sender is our window)
- [ ] SCA tooling integration (Socket.dev or Snyk) in CI
- [ ] `will-navigate` handler for external URL blocking
- [ ] `setWindowOpenHandler` returning `{ action: 'deny' }`
- [ ] Release checksums published
- [ ] Dependency audit automated in CI

---

## Appendix A: References

- [Electron Security Guidelines](https://www.electronjs.org/docs/latest/tutorial/security)
- [safeStorage Documentation](https://www.electronjs.org/docs/latest/api/safe-storage)
- [OWASP Electron Security Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Electron_Security_Cheat_Sheet.html)
- [OpenAI API Security](https://platform.openai.com/docs/guides/safety-best-practices)
- [Anthropic API Security](https://docs.anthropic.com/claude/reference/security)
- [npm audit documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
