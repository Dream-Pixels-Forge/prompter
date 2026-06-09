import { existsSync, readFileSync } from 'node:fs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { app, safeStorage } from 'electron';
import type { HistoryEntry } from '../shared/types';

const HISTORY_FILE = 'prompter-history.json';
const KEYS_FILE = 'prompter-keys.json';
const SETTINGS_FILE = 'prompter-settings.json';
const MAX_HISTORY = 500;

export class StorageService {
  private userDataPath: string;
  private history: HistoryEntry[] = [];
  private historyPath: string;
  private keysPath: string;
  private settingsPath: string;
  private writeQueue: Promise<void> = Promise.resolve();
  /** In-memory cache of which services have API keys (avoids re-reading on every check) */
  private keyStatusCache: Map<string, boolean> = new Map();

  constructor() {
    this.userDataPath = app.getPath('userData');
    this.historyPath = path.join(this.userDataPath, HISTORY_FILE);
    this.keysPath = path.join(this.userDataPath, KEYS_FILE);
    this.settingsPath = path.join(this.userDataPath, SETTINGS_FILE);
    this.loadHistory();
  }

  /**
   * Serialise writes through a promise chain so concurrent calls never interleave.
   * Uses async fs to avoid blocking the main process event loop.
   */
  private enqueueWrite(fn: () => Promise<void>): void {
    this.writeQueue = this.writeQueue.then(fn).catch((err) => console.error('[Storage] Write queue error:', err));
  }

  // ── History Persistence ──────────────────────────────

  private loadHistory(): void {
    try {
      if (existsSync(this.historyPath)) {
        const raw = readFileSync(this.historyPath, 'utf-8');
        this.history = JSON.parse(raw);
        if (!Array.isArray(this.history)) this.history = [];
      }
    } catch (err) {
      console.error('[Storage] Failed to load history:', err);
      this.history = [];
    }
  }

  private persistHistory(): void {
    this.enqueueWrite(async () => {
      try {
        const data = JSON.stringify(this.history, null, 2);
        await fs.writeFile(this.historyPath, data, 'utf-8');
      } catch (err) {
        console.error('[Storage] Failed to save history:', err);
      }
    });
  }

  insertHistory(entry: HistoryEntry): void {
    this.history.unshift(entry);
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(0, MAX_HISTORY);
    }
    this.persistHistory();
  }

  listHistory(limit = 50, offset = 0): HistoryEntry[] {
    return this.history.slice(offset, offset + limit);
  }

  searchHistory(query: string): HistoryEntry[] {
    const q = query.toLowerCase();
    return this.history.filter(
      (e) =>
        e.rawInput.toLowerCase().includes(q) ||
        e.structuredOutput.toLowerCase().includes(q) ||
        e.framework?.toLowerCase().includes(q),
    );
  }

  deleteHistory(id: string): void {
    this.history = this.history.filter((e) => e.id !== id);
    this.persistHistory();
  }

  clearHistory(): void {
    this.history = [];
    this.persistHistory();
  }

  // ── Encrypted API Key Storage ────────────────────────

  /** Check whether encryption is available on this platform. Cached after first call. */
  private _encryptionAvailable: boolean | null = null;
  private isEncryptionAvailable(): boolean {
    if (this._encryptionAvailable === null) {
      this._encryptionAvailable = safeStorage.isEncryptionAvailable();
    }
    return this._encryptionAvailable;
  }

  saveApiKey(service: string, apiKey: string): void {
    if (!this.isEncryptionAvailable()) {
      throw new Error(
        'System encryption unavailable — cannot securely store API key. ' +
          'Run in an environment with safeStorage support (macOS, Windows, or Linux with a keyring).',
      );
    }
    const encrypted = safeStorage.encryptString(apiKey);
    const encryptedBase64 = encrypted.toString('base64');

    // Invalidate cache for this service
    this.keyStatusCache.set(service, true);

    // Read-then-write inside the queue to prevent race conditions
    this.enqueueWrite(async () => {
      try {
        let keys: Record<string, string> = {};
        if (await fs.access(this.keysPath).then(() => true).catch(() => false)) {
          const raw = await fs.readFile(this.keysPath, 'utf-8');
          keys = JSON.parse(raw);
        }
        keys[service] = encryptedBase64;
        await fs.writeFile(this.keysPath, JSON.stringify(keys, null, 2), 'utf-8');
      } catch (err) {
        console.error('[Storage] Failed to save API key:', err);
      }
    });
  }

  hasApiKey(service: string): boolean {
    // Check cache first
    const cached = this.keyStatusCache.get(service);
    if (cached !== undefined) {
      return cached;
    }
    try {
      if (!existsSync(this.keysPath)) return false;
      const keys: Record<string, string> = JSON.parse(readFileSync(this.keysPath, 'utf-8'));
      const exists = !!keys[service];
      this.keyStatusCache.set(service, exists);
      return exists;
    } catch {
      this.keyStatusCache.set(service, false);
      return false;
    }
  }

  /**
   * Batch-check which services have API keys.
   * Returns a map of service → boolean, using the cache where possible.
   */
  getApiKeyStatuses(services: string[]): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    let keysFileParsed: Record<string, string> | null = null;

    // Only parse the keys file once if we need to
    const needsFileRead = services.some((s) => !this.keyStatusCache.has(s));
    if (needsFileRead) {
      try {
        if (existsSync(this.keysPath)) {
          keysFileParsed = JSON.parse(readFileSync(this.keysPath, 'utf-8'));
        }
      } catch {
        keysFileParsed = {};
      }
    }

    for (const service of services) {
      const cached = this.keyStatusCache.get(service);
      if (cached !== undefined) {
        result[service] = cached;
      } else {
        const exists = !!keysFileParsed?.[service];
        this.keyStatusCache.set(service, exists);
        result[service] = exists;
      }
    }

    return result;
  }

  /** Invalidate the key status cache for a service (e.g. after deletion). */
  invalidateKeyCache(service: string): void {
    this.keyStatusCache.delete(service);
  }

  getApiKey(service: string): string | null {
    try {
      if (!existsSync(this.keysPath)) return null;
      const keys: Record<string, string> = JSON.parse(readFileSync(this.keysPath, 'utf-8'));
      const stored = keys[service];
      if (!stored) return null;

      if (!this.isEncryptionAvailable()) return null;
      return safeStorage.decryptString(Buffer.from(stored, 'base64'));
    } catch (err) {
      console.error('[Storage] Failed to read API key:', err);
      return null;
    }
  }

  // ── Settings Persistence ────────────────────────────────

  loadSettings(): Record<string, unknown> {
    try {
      if (existsSync(this.settingsPath)) {
        const raw = readFileSync(this.settingsPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[Storage] Failed to load settings:', err);
    }
    return {};
  }

  saveSettings(settings: Record<string, unknown>): void {
    this.enqueueWrite(async () => {
      try {
        await fs.writeFile(this.settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
      } catch (err) {
        console.error('[Storage] Failed to save settings:', err);
      }
    });
  }
}
