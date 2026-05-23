import {
  type GenerateRequest,
  type GenerateResponse,
  type AppSettings,
  type OllamaStatus,
  type HistoryEntry,
} from '@/shared/types';

declare global {
  interface Window {
    api: {
      llm: {
        generate: (req: GenerateRequest) => Promise<GenerateResponse>;
      };
      clipboard: {
        write: (text: string) => Promise<boolean>;
      };
      window: {
        setBounds: (bounds: { x: number; y: number }) => Promise<boolean>;
        toggle: () => Promise<boolean>;
      };
      settings: {
        get: () => Promise<Partial<AppSettings>>;
        set: (settings: Partial<AppSettings>) => Promise<boolean>;
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
        clear: () => Promise<boolean>;
      };
      store: {
        saveApiKey: (service: string, key: string) => Promise<boolean>;
        getApiKey: (service: string) => Promise<string | null>;
      };
    };
  }
}

export async function generatePrompt(req: GenerateRequest): Promise<GenerateResponse> {
  return window.api.llm.generate(req);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  return window.api.clipboard.write(text);
}

// ── History API ──────────────────────────────────────

export async function insertHistory(entry: HistoryEntry): Promise<boolean> {
  return window.api.history.insert(entry);
}

export async function listHistory(limit = 50, offset = 0): Promise<HistoryEntry[]> {
  return window.api.history.list(limit, offset);
}

export async function searchHistory(query: string): Promise<HistoryEntry[]> {
  return window.api.history.search(query);
}

export async function deleteHistory(id: string): Promise<boolean> {
  return window.api.history.delete(id);
}

export async function clearHistory(): Promise<boolean> {
  return window.api.history.clear();
}

// ── Encryption Store API ────────────────────────────

export async function saveApiKey(service: string, key: string): Promise<boolean> {
  return window.api.store.saveApiKey(service, key);
}

export async function getApiKey(service: string): Promise<string | null> {
  return window.api.store.getApiKey(service);
}
