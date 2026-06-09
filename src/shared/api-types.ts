import type { AppSettings, AppTab, GenerateRequest, GenerateResponse, HistoryEntry, OllamaStatus } from './types';

export interface PrompterApi {
  llm: {
    generate: (req: GenerateRequest) => Promise<GenerateResponse>;
    /** Cancel a specific request by ID, or all if no ID provided */
    cancel: (requestId?: string) => Promise<boolean>;
  };
  clipboard: {
    write: (text: string) => Promise<boolean>;
  };
  window: {
    setBounds: (bounds: { x: number; y: number }) => Promise<boolean>;
    toggle: () => Promise<boolean>;
    resize: (width: number, height: number) => void;
    getPosition: () => Promise<{ x: number; y: number }>;
  };
  settings: {
    get: () => Promise<Partial<AppSettings>>;
    set: (settings: Partial<AppSettings>) => Promise<boolean>;
  };
  provider: {
    check: (providerId: string) => Promise<{ available: boolean; message?: string }>;
  };
  ollama: {
    check: () => Promise<OllamaStatus>;
  };
  stt: {
    transcribe: (audioData: string) => Promise<string>;
  };
  history: {
    insert: (entry: HistoryEntry) => Promise<boolean>;
    list: (limit?: number, offset?: number) => Promise<HistoryEntry[]>;
    search: (query: string) => Promise<HistoryEntry[]>;
    delete: (id: string) => Promise<boolean>;
    clear: (confirmed?: boolean) => Promise<boolean>;
    exportAll: () => Promise<string | null>;
    /** Batch-check which services have API keys (single IPC call instead of N) */
    getKeyStatuses: (services: string[]) => Promise<Record<string, boolean>>;
  };
  store: {
    saveApiKey: (service: string, key: string) => Promise<boolean>;
    hasApiKey: (service: string) => Promise<boolean>;
  };
  hotkey: {
    onTriggered: (callback: (action: string) => void) => () => void;
  };
  tray: {
    onNavigate: (callback: (tab: AppTab) => void) => () => void;
  };
  app: {
    quit: () => Promise<void>;
    getVersion: () => Promise<string>;
  };
}
