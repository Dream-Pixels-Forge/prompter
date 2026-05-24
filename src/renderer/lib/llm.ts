import type { GenerateRequest, GenerateResponse, HistoryEntry } from '@/shared/types';

export async function generatePrompt(req: GenerateRequest): Promise<GenerateResponse> {
  return window.api.llm.generate(req);
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
