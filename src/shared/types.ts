// ── IPC Channel Names ──────────────────────────────────

export const IPC_CHANNELS = {
  LLM_GENERATE: 'llm:generate',
  CLIPBOARD_WRITE: 'clipboard:write',
  STT_START: 'stt:start',
  STORE_HAS_API_KEY: 'store:hasApiKey',
  STORE_SAVE_API_KEY: 'store:saveApiKey',
  HISTORY_INSERT: 'history:insert',
  HISTORY_LIST: 'history:list',
  HISTORY_SEARCH: 'history:search',
  HISTORY_DELETE: 'history:delete',
  HISTORY_CLEAR: 'history:clear',
  HISTORY_EXPORT: 'history:export',
  WINDOW_SET_BOUNDS: 'window:setBounds',
  WINDOW_TOGGLE: 'window:toggle',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  OLLAMA_CHECK: 'ollama:check',
  HOTKEY_TRIGGERED: 'hotkey:triggered',
  WINDOW_RESIZE: 'window:resize',
  WINDOW_POS_GET: 'window:pos:get',
  APP_QUIT: 'app:quit',
  PROVIDER_CHECK: 'provider:check',
  TRAY_NAVIGATE: 'tray:navigate',
  LLM_CANCEL: 'llm:cancel',
} as const;

// ── Framework Definitions ─────────────────────────────

export interface FrameworkSection {
  key: string;
  label: string;
  placeholder: string;
  defaultContent: string;
}

export interface Framework {
  id: string;
  name: string;
  description: string;
  sections: FrameworkSection[];
  color: string;
}

// ── Template Definitions ──────────────────────────────

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  domain: string;
  audienceHint: string;
  framework: string;
  defaultInput: string;
}

// ── Prompt Generation ─────────────────────────────────

export interface GenerateRequest {
  input: string;
  framework: string;
  template?: string;
}

export interface GenerateResponse {
  sections: Record<string, string>;
  raw: string;
  framework: string;
  template?: string;
}

// ── LLM Orchestrator ──────────────────────────────────

export type ProviderType = string; // Open string — any registered provider ID

export interface OllamaStatus {
  available: boolean;
  version?: string;
  models?: string[];
}

// ── History ────────────────────────────────────────────

export interface HistoryEntry {
  id: string;
  rawInput: string;
  structuredOutput: string;
  framework: string;
  template?: string;
  createdAt: string;
}

// ── Settings ──────────────────────────────────────────

export interface AppSettings {
  /** Currently active provider ID */
  activeProvider: string;
  /** Per-provider runtime config, keyed by provider ID */
  providerConfigs: Record<string, { model: string; endpoint?: string }>;
  /** Recently used providers (list of IDs, newest first) */
  recentProviders: string[];
  /** Settings file format version for migrations */
  version: number;
  /** Hotkeys */
  hotkeyToggle: string;
  hotkeyMic: string;
  /** Launch on system startup */
  launchOnStartup: boolean;
  /** Seconds before the expanded bubble auto-hides */
  autoHideDelay: number;
  /** UI color theme */
  theme: 'dark' | 'light' | 'system';
}

// ── Window State ──────────────────────────────────────

// ── UI State ──────────────────────────────────────────

export type AppTab = 'compose' | 'templates' | 'history' | 'settings';
