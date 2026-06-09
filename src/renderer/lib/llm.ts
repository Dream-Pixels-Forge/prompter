import type { GenerateRequest, GenerateResponse, HistoryEntry } from '@/shared/types';

export interface GenerateResult extends GenerateResponse {
  requestId: string;
}

export async function generatePrompt(req: GenerateRequest): Promise<GenerateResult> {
  return window.api.llm.generate(req) as Promise<GenerateResult>;
}

/**
 * Cancel an in-flight LLM generation.
 * @param requestId - Optional specific request ID to cancel. If omitted, cancels all.
 */
export async function cancelGeneration(requestId?: string): Promise<void> {
  await window.api.llm.cancel(requestId);
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

export async function clearHistory(confirmed = false): Promise<boolean> {
  return window.api.history.clear(confirmed);
}

export async function exportHistory(): Promise<string | null> {
  return window.api.history.exportAll();
}

// ── Encryption Store API ────────────────────────────

export async function saveApiKey(service: string, key: string): Promise<boolean> {
  return window.api.store.saveApiKey(service, key);
}

export async function hasApiKey(service: string): Promise<boolean> {
  return window.api.store.hasApiKey(service);
}

// ── Batch Key Status ────────────────────────────────

export async function getKeyStatuses(services: string[]): Promise<Record<string, boolean>> {
  return window.api.history.getKeyStatuses(services);
}
