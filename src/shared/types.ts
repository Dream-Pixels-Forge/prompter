// ── IPC Channel Names ──────────────────────────────────

export const IPC_CHANNELS = {
  LLM_GENERATE: 'llm:generate',
  CLIPBOARD_WRITE: 'clipboard:write',
  STT_START: 'stt:start',
  STORE_GET_API_KEY: 'store:getApiKey',
  STORE_SAVE_API_KEY: 'store:saveApiKey',
  HISTORY_INSERT: 'history:insert',
  HISTORY_LIST: 'history:list',
  HISTORY_SEARCH: 'history:search',
  HISTORY_DELETE: 'history:delete',
  HISTORY_CLEAR: 'history:clear',
  WINDOW_SET_BOUNDS: 'window:setBounds',
  WINDOW_TOGGLE: 'window:toggle',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  OLLAMA_CHECK: 'ollama:check',
  HOTKEY_TRIGGERED: 'hotkey:triggered',
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

export type ProviderType = 'ollama' | 'openai' | 'anthropic';

export interface LLMProvider {
  type: ProviderType;
  model: string;
  baseUrl?: string;
}

export interface LLMConfig {
  provider: LLMProvider;
  fallbackProvider?: LLMProvider;
  apiKey?: string;
}

export interface LLMGenerateOptions {
  provider: ProviderType;
  model: string;
  baseUrl?: string;
  apiKey?: string;
}

export interface StreamChunk {
  type: 'chunk' | 'done' | 'error';
  text?: string;
  error?: string;
}

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
  activeProvider: ProviderType;
  ollamaEndpoint: string;
  ollamaModel: string;
  openaiModel: string;
  openaiApiKey: string;
  anthropicModel: string;
  anthropicApiKey: string;
  hotkeyToggle: string;
  hotkeyMic: string;
}

// ── Window State ──────────────────────────────────────

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ── UI State ──────────────────────────────────────────

export type BubbleState = 'dormant' | 'expanded' | 'listening' | 'processing';
export type AppTab = 'compose' | 'templates' | 'history' | 'settings';

export const OPENAI_MODELS = [
  'gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'o3', 'o4-mini',
];

export const ANTHROPIC_MODELS = [
  'claude-sonnet-4-20250514', 'claude-sonnet-4', 'claude-haiku-3-5-20241022', 'claude-opus-4-20250514',
];
