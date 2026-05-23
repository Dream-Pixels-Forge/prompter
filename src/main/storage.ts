import { app, safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { type HistoryEntry } from '../shared/types';

const HISTORY_FILE = 'prompter-history.json';
const KEYS_FILE = 'prompter-keys.json';

export class StorageService {
  private userDataPath: string;
  private history: HistoryEntry[] = [];
  private historyPath: string;
  private keysPath: string;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor() {
    this.userDataPath = app.getPath('userData');
    this.historyPath = path.join(this.userDataPath, HISTORY_FILE);
    this.keysPath = path.join(this.userDataPath, KEYS_FILE);
    this.loadHistory();
  }

  private enqueueWrite(fn: () => void): void {
    this.writeQueue = this.writeQueue.then(fn, fn);
  }

  // ── History Persistence ──────────────────────────────

  private loadHistory(): void {
    try {
      if (fs.existsSync(this.historyPath)) {
        const raw = fs.readFileSync(this.historyPath, 'utf-8');
        this.history = JSON.parse(raw);
      }
    } catch (err) {
      console.error('[Storage] Failed to load history:', err);
      this.history = [];
    }
  }

  private persistHistory(): void {
    const data = JSON.stringify(this.history, null, 2);
    this.enqueueWrite(() => {
      try {
        fs.writeFileSync(this.historyPath, data, 'utf-8');
      } catch (err) {
        console.error('[Storage] Failed to save history:', err);
      }
    });
  }

  insertHistory(entry: HistoryEntry): void {
    this.history.unshift(entry);
    if (this.history.length > 500) {
      this.history = this.history.slice(0, 500);
    }
    this.persistHistory();
  }

  listHistory(limit = 50, offset = 0): HistoryEntry[] {
    return this.history.slice(offset, offset + limit);
  }

  searchHistory(query: string): HistoryEntry[] {
    const q = query.toLowerCase();
    return this.history.filter(
      e =>
        e.rawInput.toLowerCase().includes(q) ||
        e.structuredOutput.toLowerCase().includes(q) ||
        (e.framework && e.framework.toLowerCase().includes(q))
    );
  }

  deleteHistory(id: string): void {
    this.history = this.history.filter(e => e.id !== id);
    this.persistHistory();
  }

  clearHistory(): void {
    this.history = [];
    this.persistHistory();
  }

  getAllHistory(): HistoryEntry[] {
    return [...this.history];
  }

  // ── Encrypted API Key Storage ────────────────────────

  saveApiKey(service: string, apiKey: string): void {
    try {
      let keys: Record<string, string> = {};
      if (fs.existsSync(this.keysPath)) {
        keys = JSON.parse(fs.readFileSync(this.keysPath, 'utf-8'));
      }

      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('System encryption unavailable — cannot securely store API key. ' +
          'Run in an environment with safeStorage support (macOS, Windows, or Linux with a keyring).');
      }
      const encrypted = safeStorage.encryptString(apiKey);
      keys[service] = encrypted.toString('base64');

      fs.writeFileSync(this.keysPath, JSON.stringify(keys, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Storage] Failed to save API key:', err);
    }
  }

  getApiKey(service: string): string | null {
    try {
      if (!fs.existsSync(this.keysPath)) return null;
      const keys: Record<string, string> = JSON.parse(fs.readFileSync(this.keysPath, 'utf-8'));
      const stored = keys[service];
      if (!stored) return null;

      if (!safeStorage.isEncryptionAvailable()) return null;
      return safeStorage.decryptString(Buffer.from(stored, 'base64'));
    } catch (err) {
      console.error('[Storage] Failed to read API key:', err);
      return null;
    }
  }

  getAllApiKeys(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const svc of ['openai', 'anthropic']) {
      const key = this.getApiKey(svc);
      if (key) result[svc] = key;
    }
    return result;
  }
}
