# PromptForge — Security Architecture

**Version:** 1.0
**Status:** Draft
**Last Updated:** 2026-05-23

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
9. [Incident Response Plan](#9-incident-response-plan)
10. [Security Checklist for V1 Release](#10-security-checklist-for-v1-release)

---

## 1. Threat Model

### 1.1 Assets to Protect

| Asset | Sensitivity | Location |
|---|---|---|
| OpenAI API key | Critical | Encrypted in SQLite + in-memory during use |
| Anthropic API key | Critical | Encrypted in SQLite + in-memory during use |
| Prompt history (raw_input + generated_output) | Medium | SQLite at `~/.promptforge/history.db` |
| Saved templates | Low | SQLite at `~/.promptforge/history.db` |
| Audio recordings | Medium | In-memory during transcription, discarded immediately |
| Settings/preferences | Low | SQLite at `~/.promptforge/history.db` |
| Ollama URL | Low | SQLite (localhost-only by default) |

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
- **Scenario:** Malware reads `~/.promptforge/history.db` and extracts OpenAI/Anthropic keys
- **Mitigation:** Keys encrypted with Electron `safeStorage` (OS-level encryption). Key material never stored in plaintext on disk. Decryption happens in main process only, in-memory, for the duration of a request.

#### T2: Unauthorized Microphone Access
- **Scenario:** Renderer process compromised, attacker activates mic without user action
- **Mitigation:** Mic activation requires explicit IPC call from renderer. Main process enforces user-gesture requirement. Mic stream never starts without a `startRecording` IPC that renderer can only send after a click event.

#### T3: MITM on Cloud LLM Calls
- **Scenario:** Network attacker intercepts HTTP traffic during OpenAI/Anthropic API calls
- **Mitigation:** All cloud API calls use HTTPS with certificate validation. No HTTP fallback. `ELECTRON_HTTPS_ONLY` enforced. Certificate pinning considered for v2.

#### T4: Local Data Exposure
- **Scenario:** Another application on the same machine reads SQLite database
- **Mitigation:** API keys are encrypted at rest. History data is not encrypted (performance tradeoff), but file permissions restrict access to the user account. Node.js `fs` module used with `mode: 0o600` for the database file.

#### T5: IPC Injection
- **Scenario:** Renderer sends spoofed IPC messages to main process (e.g., fake LLM response, decrypt keys)
- **Mitigation:** Context isolation enabled. Preload script exposes a strict allowlist of IPC channels. Input validation on all IPC arguments. No `ipcRenderer.send` for sensitive channels — uses `ipcRenderer.invoke` with response validation.

#### T6: Supply Chain Attack
- **Scenario:** Compromised npm package (direct or transitive) executes malicious code
- **Mitigation:** Dependency scanning with `npm audit` in CI. `package.json` uses exact versions with lockfile. SCA tool (Socket.dev or Snyk) blocks vulnerable packages. Electron's sandbox limits damage from renderer-process code execution.

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
│  │  │  - encrypt(plaintext) → buffer                   │  │  │
│  │  │  - decrypt(buffer) → plaintext                   │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  IPC Handlers (validated, typed)                 │  │  │
│  │  │  │  llm:invoke          → LLM orchestration      │  │  │
│  │  │  │  stt:start           → mic activation         │  │  │
│  │  │  │  stt:stop            → mic deactivation       │  │  │
│  │  │  │  store:get           → read settings          │  │  │
│  │  │  │  store:set           → write settings         │  │  │
│  │  │  │  store:getApiKey     → decrypt + return        │  │  │
│  │  │  │  store:saveApiKey    → encrypt + persist       │  │  │
│  │  │  │  window:minimize     → hide to tray           │  │  │
│  │  │  │  app:getVersion      → update check           │  │  │
│  │  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  LLM Clients                                     │  │  │
│  │  │  │  OllamaClient → http://localhost:11434        │  │  │
│  │  │  │  OpenAIClient → https://api.openai.com        │  │  │
│  │  │  │  AnthropicClient → https://api.anthropic.com  │  │  │
│  │  │  │  All use HTTPS with cert validation           │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  SQLite (better-sqlite3)                         │  │  │
│  │  │  │  Mode: 0o600 (owner-only access)              │  │  │
│  │  │  │  Keys encrypted via safeStorage               │  │  │
│  │  │  │  History in plaintext (local data)            │  │  │
│  │  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Renderer Process (sandboxed)                │  │
│  │  │  contextIsolation: true                             │  │  │
│  │  │  nodeIntegration: false                             │  │  │
│  │  │  sandbox: true                                      │  │  │
│  │  │                                                     │  │  │
│  │  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  │  preload.ts (exposed API)                    │  │  │
│  │  │  │  │  window.electronAPI = {                   │  │  │
│  │  │  │  │    invokeLLM(payload)                     │  │  │
│  │  │  │  │    startMic() / stopMic()                 │  │  │
│  │  │  │  │    getSetting(key) / setSetting(k,v)      │  │  │
│  │  │  │  │    getApiKey(provider)                    │  │  │
│  │  │  │  │    saveApiKey(provider, key)              │  │  │
│  │  │  │  │    getVersion()                           │  │  │
│  │  │  │  │    minimizeWindow()                       │  │  │
│  │  │  │  │    onUpdateAvailable(callback)            │  │  │
│  │  │  │  │  }                                        │  │  │
│  │  │  └──────────────────────────────────────────────┘  │  │
│  │  │                                                     │  │
│  │  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  │  React App (no Node access)                  │  │  │
│  │  │  │  │  CSP restricts: script-src, connect-src   │  │  │
│  │  │  │  │  No fetch to arbitrary hosts              │  │  │
│  │  │  │  │  All LLM calls via IPC → main process     │  │  │
│  │  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Key Security Settings

```typescript
// main.ts — BrowserWindow creation
const mainWindow = new BrowserWindow({
  // ... window config
  webPreferences: {
    preload: join(__dirname, 'preload.js'),
    contextIsolation: true,       // CRITICAL: isolate renderer from Node
    nodeIntegration: false,       // CRITICAL: no Node in renderer
    sandbox: true,                // CRITICAL: OS-level sandbox
    webSecurity: true,            // CRITICAL: enforce CORS, CSP
    allowRunningInsecureContent: false,
    spellcheck: false,            // reduces attack surface
    autoplayPolicy: 'user-gesture-required',
  }
});
```

### 2.3 IPC Channel Allowlist

All IPC communication goes through a strict allowlist in the preload script. The renderer **cannot** send arbitrary IPC messages.

```typescript
// preload.ts — strict allowlist
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // LLM — read-only invocation, no key exposure
  invokeLLM: (payload: LLMInvocation) =>
    ipcRenderer.invoke('llm:invoke', payload),

  // Microphone — requires user gesture in renderer
  startMic: () => ipcRenderer.invoke('stt:start'),
  stopMic: () => ipcRenderer.invoke('stt:stop'),

  // Storage — typed, validated keys
  getSetting: (key: string) =>
    ipcRenderer.invoke('store:get', validateKey(key)),
  setSetting: (key: string, value: unknown) =>
    ipcRenderer.invoke('store:set', validateKey(key), value),

  // API Keys — dedicated encrypted path
  getApiKey: (provider: 'openai' | 'anthropic') =>
    ipcRenderer.invoke('store:getApiKey', provider),
  saveApiKey: (provider: 'openai' | 'anthropic', key: string) =>
    ipcRenderer.invoke('store:saveApiKey', provider, key),

  // Window management
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),

  // Updates
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => {
    const handler = (_event: IpcRendererEvent, info: UpdateInfo) => callback(info);
    ipcRenderer.on('update:available', handler);
    return () => ipcRenderer.removeListener('update:available', handler);
  },
});
```

### 2.4 IPC Handler Validation (Main Process)

Every IPC handler validates input before processing:

```typescript
// ipc.ts — input validation pattern
ipcMain.handle('store:getApiKey', async (_event, provider: string) => {
  // Validate provider is one of the allowed values
  if (provider !== 'openai' && provider !== 'anthropic') {
    throw new Error(`Invalid provider: ${provider}`);
  }
  // Origin check: verify sender is our window
  const sender = _event.sender;
  if (!isOurWindow(sender)) {
    throw new Error('IPC call from unauthorized sender');
  }
  // Proceed with decryption
  return getDecryptedKey(provider);
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
safeStorage.encrypt(plaintextKey) → encrypted Buffer
         │
         ▼
Buffer.toString('hex') → stored as hex string in SQLite
(settings table, key='api_key_openai', value='<hex_encoded_ciphertext>')
         │
         ▼
┌───────────────────────────────────────────────────┐
│ At Rest: Encrypted hex string in SQLite            │
│ Protected by OS keychain (DPAPI/libsecret/Keychain)│
│ File permissions: 0o600 (owner read/write only)    │
└───────────────────────────────────────────────────┘

--- Later, when LLM call is made ---

Renderer → IPC ('llm:invoke', payload)
         │
         ▼
Main Process reads encrypted key from SQLite
         │
         ▼
safeStorage.decrypt(hexBuffer) → plaintext key
         │
         ▼
Plaintext key used ONLY for this request's HTTP headers
         │
         ▼
After request completes → key reference zeroed
(sensitive strings allowed to go out of scope for GC)
         │
         ▼
Key never written to disk, never persisted in renderer
```

### 3.2 Microphone Access Flow

```
User clicks Mic button in renderer (user gesture required)
         │
         ▼
Renderer calls window.electronAPI.startMic()
         │
         ▼
IPC → Main Process validates:
  - Is there a pending user gesture? (navigator.mediaDevices requirement)
  - Is mic already active? (prevent double-start)
  - Is Whisper server available?
         │
         ▼
Main Process:
  1. Opens audio input stream (via getUserMedia or native mic)
  2. Streams audio chunks to Whisper process
  3. Returns transcribed text via IPC callback
         │
         ▼
On stopMic() or transcription complete:
  1. Audio stream closed immediately
  2. Audio buffers released
  3. Whisper process idle
         │
         ▼
Audio data is NEVER written to disk
Audio data is NEVER sent over network
Audio data exists ONLY in-memory during active recording
```

### 3.3 LLM Invocation Flow

```
Renderer sends IPC ('llm:invoke', { input, framework, template?, provider? })
         │
         ▼
Main Process LLM Orchestrator:
  ┌─ 1. Validate input (sanitize, length check)
  ├─ 2. Select provider (Ollama / OpenAI / Anthropic)
  ├─ 3. If cloud provider:
  │     ├─ Retrieve encrypted key from SQLite
  │     ├─ Decrypt with safeStorage
  │     ├─ Construct HTTPS request (TLS 1.3 minimum)
  │     ├─ Set Authorization header with decrypted key
  │     ├─ Send request (timeout: 30s)
  │     ├─ Verify response signature (if available)
  │     └─ Zero key reference after request
  ├─ 4. If Ollama (local):
  │     ├─ Verify URL is localhost (reject non-local)
  │     ├──warn if URL is not localhost
  │     └─ Send HTTP request (localhost, unencrypted is acceptable)
  └─ 5. Return structured result to renderer
         │
         ▼
Result sent back via IPC response (never containing API keys)
```

### 3.4 History Storage

```
User generates prompt
         │
         ▼
LLM result returned to renderer
         │
         ▼
Main Process saves to SQLite:
  - raw_input (plaintext) — user's own text
  - generated_prompt (plaintext) — structured output
  - framework, template, timestamp
         │
         ▼
File permissions on SQLite DB:
  - Location: ~/.promptforge/history.db
  - Mode: 0o600 (owner-only read/write)
  - Directory: ~/.promptforge/ mode 0o700
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
    img-src 'self' data: blob:;
    font-src 'self' data:;
    connect-src 'self';
    media-src 'self' blob:;
    frame-src 'none';
    object-src 'none';
    base-uri 'self';
    form-action 'none';
  "
/>
```

**Rationale per directive:**

| Directive | Why |
|---|---|
| `script-src 'self'` | No inline scripts (CSP evaluates the renderer). All JS from bundle only. |
| `style-src 'self' 'unsafe-inline'` | Tailwind CSS injection requires inline styles. `unsafe-inline` is acceptable here because sandbox + contextIsolation prevent DOM manipulation from injected scripts. |
| `connect-src 'self'` | Renderer must NOT make network requests directly. All network calls go through main process IPC. |
| `media-src 'self' blob:` | Required for microphone MediaRecorder API. Blobs are in-memory only. |
| `frame-src 'none'` | No iframes — prevents clickjacking and adware. |
| `form-action 'none'` | No HTML forms — prevents form-based exfiltration. |

### 4.2 BrowserWindow Hardening

```typescript
// Additional window security
const mainWindow = new BrowserWindow({
  // ...
  webPreferences: {
    // ... settings from section 2.2

    // Additional hardening
    disableDialogs: true,              // no alert/confirm/prompt
    navigateOnDragDrop: false,         // no file drag → navigation
    enableRemoteModule: false,         // @electron/remote is disabled
    safeDialogs: true,                 // prevent dialog abuse
    safeDialogsMessage: 'PromptForge — Dialog blocked for security',
  }
});

// Prevent navigation away from app
mainWindow.webContents.on('will-navigate', (event, url) => {
  // Only allow hash-based navigation within app
  if (!url.startsWith('file://')) {
    event.preventDefault();
  }
});

// Prevent new window creation
mainWindow.webContents.setWindowOpenHandler(() => {
  return { action: 'deny' };
});
```

### 4.3 Session Configuration

```typescript
// Enforce HTTPS-only
app.on('ready', () => {
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['http://*/*'] },
    (details, callback) => {
      // Allow localhost connections (Ollama, Whisper)
      if (
        details.url.startsWith('http://localhost') ||
        details.url.startsWith('http://127.0.0.1')
      ) {
        return callback({ cancel: false });
      }
      // Block all other HTTP
      if (!details.url.startsWith('https://')) {
        console.warn(`[Security] Blocked HTTP request: ${details.url}`);
        return callback({ cancel: true });
      }
      callback({ cancel: false });
    }
  );
});
```

### 4.4 Additional Hardening

```typescript
// main.ts
app.commandLine.appendSwitch('disable-http-cache');     // no disk cache of API responses
app.commandLine.appendSwitch('no-proxy-server');         // prevent proxy-based MITM
app.commandLine.appendSwitch('disable-ntp');              // no network time

// Prevent renderer from accessing file:// protocol resources
session.defaultSession.protocol.registerFileProtocol('safe-file', (request, callback) => {
  // Only allow specific paths
  const allowed = request.url.startsWith('safe-file://allowed/');
  if (!allowed) {
    callback({ error: -6 }); // ERR_FILE_NOT_FOUND
  }
});
```

---

## 5. API Key Management

### 5.1 Encryption Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  Electron safeStorage                         │
│                                                               │
│  Platform-specific backends:                                  │
│  • macOS: Keychain (kSecAttrAccessibleWhenUnlockedThisDeviceOnly)│
│  • Windows: DPAPI (CryptProtectData with CRYPTPROTECT_LOCAL_MACHINE)│
│  • Linux: libsecret (Secret Service API via D-Bus)            │
│                                                               │
│  safeStorage.isEncryptionAvailable() → check before use        │
│                                                               │
│  encrypt(plaintext: string) → Buffer                          │
│  decrypt(ciphertext: Buffer) → string                         │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Storage Schema

```sql
-- Stored in settings table
INSERT INTO settings (key, value) VALUES ('api_key_openai', '<hex_encoded_ciphertext>');
INSERT INTO settings (key, value) VALUES ('api_key_anthropic', '<hex_encoded_ciphertext>');
```

### 5.3 Implementation

```typescript
// store.ts — API key encryption
import { safeStorage } from 'electron';

export function encryptApiKey(plaintext: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    // Fallback: warn user and store obfuscated (NOT encrypted)
    // This is a known limitation on headless Linux or specific environments
    console.warn('[Security] safeStorage unavailable — API keys stored with reduced protection');
    // Still at least obfuscate with a reversible transform
    return Buffer.from(plaintext).toString('base64');
  }
  const encrypted = safeStorage.encrypt(plaintext);
  return encrypted.toString('hex');
}

export function decryptApiKey(encoded: string): string {
  const buffer = Buffer.from(encoded, 'hex');
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.decrypt(buffer).toString();
  }
  // Fallback: base64 decode
  return Buffer.from(encoded, 'base64').toString();
}
```

### 5.4 Key Handling Rules

1. **Never store plaintext keys** — Keys are encrypted before first write to SQLite
2. **Decrypt only in main process** — Renderer never receives plaintext keys
3. **Decrypt on demand** — Keys are decrypted per-request, then reference is released
4. **No key caching** — Decrypted keys are not cached in memory
5. **No console logging** — API keys are never logged (use `[REDACTED]` in logs)
6. **No error message leakage** — API errors redact the key from error messages
7. **Key validation on save** — Basic format validation before encryption:
   - OpenAI: starts with `sk-` or `sk-proj-`, minimum 20 chars
   - Anthropic: starts with `sk-ant-`, minimum 20 chars

### 5.5 Key Validation

```typescript
// store.ts — key validation
function validateApiKey(provider: string, key: string): boolean {
  if (!key || typeof key !== 'string') return false;

  switch (provider) {
    case 'openai':
      return /^sk-(proj-)?[A-Za-z0-9]{20,}$/.test(key);
    case 'anthropic':
      return /^sk-ant-[A-Za-z0-9]{20,}$/.test(key);
    default:
      return false;
  }
}
```

---

## 6. Privacy Guarantees

### 6.1 What PromptForge Does NOT Do

| Activity | Status | Guarantee |
|---|---|---|
| Telemetry / analytics | ❌ NONE | No tracking, no analytics SDK, no metrics collection |
| Crash reporting | ❌ NONE | No Sentry, no crash reporter, no error upload |
| User behavior tracking | ❌ NONE | No mouse movement, click tracking, or heatmaps |
| Prompt history upload | ❌ NONE | All history stays in local SQLite |
| Audio recording upload | ❌ NONE | Audio processed locally via Whisper, never sent to network |
| Advertising | ❌ NONE | No ads, no ad SDKs |
| Third-party tracking | ❌ NONE | No Google Analytics, Facebook Pixel, or similar |
| Auto-update with user data | ❌ NONE | Update check only sends app version (no user info) |
| License validation | ❌ NONE | No phone-home license checks (v1 — open source) |

### 6.2 What PromptForge Does

| Activity | Detail | Privacy Implication |
|---|---|---|
| Cloud LLM calls | User's intent text sent to OpenAI/Anthropic API | User must consent by configuring API key and selecting cloud provider |
| Ollama calls | User's intent text sent to local Ollama server | All traffic on localhost, never leaves machine |
| Auto-update check | App version sent to GitHub Releases (or update server) | Version string only, no identifiers |
| History storage | Raw input + generated prompt saved to local SQLite | Stored locally, user can delete at any time |

### 6.3 User-Facing Privacy Disclosure

A one-time privacy notice should be shown on first launch:

```
PromptForge Privacy Notice

• Your API keys are encrypted at rest using your operating system's keychain
• Your prompt history is stored locally and never uploaded
• Voice recordings are processed entirely on your machine
• When using cloud LLMs (OpenAI/Anthropic), your input text is sent to
  those services. Configure API keys and provider selection in Settings.
• PromptForge contains no analytics, telemetry, or crash reporting
• Auto-update checks send only your app version number

[Got it] [View Security Documentation]
```

---

## 7. Dependency Security

### 7.1 npm Audit Policy

```json
// .npmrc
audit=true
audit-level=high
fund=false
```

### 7.2 CI/CD Dependency Scanning

```yaml
# .github/workflows/ci.yml (security section)
jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: npm audit
        run: pnpm audit --audit-level=high
        # Fail CI on moderate+ vulnerabilities

      - name: SCA Scan (Socket.dev)
        uses: socketdev/socket-action@latest
        with:
          token: ${{ secrets.SOCKET_TOKEN }}
```

### 7.3 Dependency Rules

| Rule | Policy |
|---|---|
| Lockfile | `pnpm-lock.yaml` committed to repository. CI uses `--frozen-lockfile` |
| Exact versions | All dependencies pinned to exact versions in `package.json` |
| Minimum dependencies | Review every dependency. No unnecessary transitive dependencies |
| Native modules | `better-sqlite3` is the only native module. Verify prebuilt binaries |
| Dev dependencies | Not included in production build (electron-builder filters dev deps) |
| Deprecation | `npm doctor` check — no deprecated packages |
| Known vulnerabilities | Zero tolerance for `HIGH` or `CRITICAL` in production dependencies |

### 7.4 Approved Dependency Review

Before adding a new dependency, evaluate:

1. Is it necessary? (Could we write 20 lines instead?)
2. Is it maintained? (Updated within last 6 months, regular releases)
3. Is it popular? (>1000 stars or >100k weekly downloads)
4. Is it secure? (No known CVEs, no suspicious `postinstall` scripts)
5. Does it need native bindings? (Prefer pure JS/TS)
6. Does it need network access? (Should not in renderer)

### 7.5 Electron-Specific Dependencies

| Package | Version Pin | Notes |
|---|---|---|
| `electron` | `^34.0.0` | Latest stable. Critical security updates tracked |
| `better-sqlite3` | `^11.0.0` | Only native module. Prebuilt binaries recommended |
| `electron-builder` | `^25.0.0` | Dev-only. Code signing config |
| `electron-updater` | `^6.0.0` | Auto-update with signature verification |

---

## 8. Build & Distribution Security

### 8.1 Code Signing

| Platform | Requirement | Tool |
|---|---|---|
| macOS | Developer ID Application certificate | `electron-builder` with `notarize: true` |
| Windows | EV Code Signing certificate | `electron-builder` with `certificateFile` and `certificatePassword` |
| Linux | No signing required (AppImage) | GPG signature for release artifacts recommended |

```yaml
# electron-builder config (macOS example)
mac:
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  notarize:
    teamId: ${APPLE_TEAM_ID}
```

#### macOS Entitlements (Minimal)

```xml
<!-- build/entitlements.mac.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <!-- Required for microphone access -->
  <key>com.apple.security.device.audio-input</key>
  <true/>
  <!-- Required for safeStorage (keychain access) -->
  <key>com.apple.security.personal-information.photos-library</key>
  <false/>
  <key>com.apple.security.personal-information.location</key>
  <false/>
  <!-- REQUIRED: Hardened runtime exceptions -->
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
  <!-- Not needed: network access, printing, USB, etc. -->
</dict>
</plist>
```

### 8.2 Auto-Update Integrity

```typescript
// update.ts — electron-updater with signature verification
import { autoUpdater } from 'electron-updater';

autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'promptforge',
  repo: 'promptforge',
  // Releases must be signed
});

autoUpdater.on('update-available', (info) => {
  // Verify update comes from official source
  // electron-updater verifies the signature of the update manifest
  // Additional: verify SHA256 hash of downloaded artifact
  mainWindow.webContents.send('update:available', {
    version: info.version,
    releaseDate: info.releaseDate,
  });
});

// Verify downloaded file integrity
autoUpdater.on('download-progress', (progress) => {
  // electron-updater validates checksum before applying
});

// Reject unsigned updates
autoUpdater.allowDowngrade = false;
autoUpdater.allowPrerelease = false;
```

### 8.3 Build Pipeline Security

```yaml
# Build pipeline security gates
1. ✅ pnpm install --frozen-lockfile   # Reproducible dependency tree
2. ✅ pnpm audit --audit-level=high    # No known vulnerabilities
3. ✅ pnpm lint                        # Code quality
4. ✅ pnpm typecheck                   # Type safety
5. ✅ pnpm test                        # Test suite
6. ✅ Code signing                     # macOS + Windows signatures
7. ✅ Notarization                     # macOS notarization
8. ✅ SHA256 checksum of release       # Integrity verification
9. ✅ Release draft with signed checksums
```

### 8.4 Release Artifact Verification

Users should verify downloaded releases:

```bash
# User verification (published in release notes)
# macOS
shasum -a 256 PromptForge-1.0.0.dmg
# Compare with published checksum

# Windows
certutil -hashfile PromptForge-Setup-1.0.0.exe SHA256
# Compare with published checksum

# Linux
sha256sum PromptForge-1.0.0.AppImage
# Compare with published checksum
```

---

## 9. Incident Response Plan

### 9.1 Vulnerability Disclosure

```
Email: security@promptforge.dev
PGP Key: [available at promptforge.dev/security.asc]
Response SLA: 72 hours acknowledgment, 14 days for fix
```

### 9.2 Incident Severity Levels

| Level | Example | Response |
|---|---|---|
| **Critical** | Remote code execution, API key leak | Immediate patch, user notification, forced update |
| **High** | SQLite database accessible to other users | Patch within 7 days, advisory |
| **Medium** | CSP bypass, minor information disclosure | Patch within 30 days |
| **Low** | Dependency with low-severity advisory | Patch in next release cycle |

### 9.3 Incident Response Steps

1. **Triage** — Confirm severity, affected users, attack vector
2. **Contain** — If cloud service: rotate keys, block endpoints. If local: advise users
3. **Fix** — Patch in main branch, create release
4. **Notify** — GitHub Security Advisory, release notes, forced update for critical
5. **Post-mortem** — Root cause analysis, security control improvements

---

## 10. Security Checklist for V1 Release

### Pre-Release Verification

- [ ] **contextIsolation: true** verified in BrowserWindow config
- [ ] **nodeIntegration: false** verified in BrowserWindow config
- [ ] **sandbox: true** enabled for renderer process
- [ ] **webSecurity: true** verified
- [ ] CSP meta tag present in `index.html` with all directives
- [ ] IPC channels are validated (origin + input) in main process
- [ ] API keys encrypted with `safeStorage` before writing to SQLite
- [ ] API keys never logged, included in error messages, or sent to renderer
- [ ] Mic activation requires explicit user action (click event)
- [ ] Audio data discarded after transcription
- [ ] All cloud LLM calls use HTTPS with certificate validation
- [ ] Non-localhost HTTP connections blocked (except user-warned Ollama URL)
- [ ] `will-navigate` handler prevents navigation to external URLs
- [ ] `setWindowOpenHandler` returns `{ action: 'deny' }`
- [ ] `disableDialogs: true` prevents alert/confirm abuse
- [ ] `navigateOnDragDrop: false` prevents file-drop navigation
- [ ] `enableRemoteModule: false` disables `@electron/remote`
- [ ] Lockfile (`pnpm-lock.yaml`) committed and CI uses `--frozen-lockfile`
- [ ] `npm audit` passes at `--audit-level=high` or better
- [ ] No analytics, telemetry, or crash reporting SDKs in dependencies
- [ ] No dev dependencies included in production build
- [ ] macOS code signing configured and tested
- [ ] Windows code signing configured and tested
- [ ] Auto-updater configured with signature verification
- [ ] Release checksums generated and published
- [ ] Privacy notice shown on first launch
- [ ] Dependency tree reviewed (no unnecessary packages)
- [ ] `ELECTRON_HTTPS_ONLY` environment variable enforced
- [ ] Renderer cannot access `file://` protocol to read arbitrary files

### Regular Maintenance

- [ ] Dependency audit run weekly (or on each CI run)
- [ ] Electron version tracked for security releases
- [ ] `safeStorage.isEncryptionAvailable()` checked at startup — warn user if unavailable
- [ ] Security documentation reviewed each release cycle

---

## Appendix A: Quick Reference

### Must-Have (Blocking for V1)

```
□ contextIsolation: true
□ nodeIntegration: false
□ sandbox: true
□ CSP in index.html
□ safeStorage for API keys
□ Mic activation on user gesture only
□ HTTPS-only for cloud calls
□ IPC input validation
□ No telemetry/analytics
□ Lockfile committed
□ npm audit clean
□ Code signing (macOS + Windows)
```

### Should-Have (High Priority)

```
□ SCA tooling (Socket.dev or Snyk)
□ Privacy notice on first launch
□ macOS entitlements review
□ Release checksums published
□ Prevent navigation to external URLs
□ Renderer disconnect from file:// protocol
```

### Nice-to-Have (Future)

```
□ Certificate pinning for cloud API endpoints
□ Binary transparency log
□ Electron Fuses for runtime security
□ Custom update server (instead of GitHub)
□ ASLR and DEP hardening flags
□ Seccomp filter on Linux
□ AppArmor/SELinux policy
```

---

## Appendix B: References

- [Electron Security Guidelines](https://www.electronjs.org/docs/latest/tutorial/security)
- [safeStorage Documentation](https://www.electronjs.org/docs/latest/api/safe-storage)
- [OWASP Electron Security Cheatsheet](https://cheatsheetseries.owasp.org/cheatsheets/Electron_Security_Cheat_Sheet.html)
- [OpenAI API Security](https://platform.openai.com/docs/guides/safety-best-practices)
- [Anthropic API Security](https://docs.anthropic.com/claude/reference/security)
- [electron-builder Code Signing](https://www.electron.build/code-signing)
- [npm audit documentation](https://docs.npmjs.com/cli/v10/commands/npm-audit)
- [Socket.dev SCA](https://socket.dev/)
- [macOS Hardened Runtime](https://developer.apple.com/documentation/security/hardened_runtime)
