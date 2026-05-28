import path from 'node:path';
import { type BrowserWindow, Menu, Tray, app, clipboard, ipcMain, nativeImage } from 'electron';
import { PROVIDER_DEFINITIONS } from '../shared/provider-definitions';
import type { AppSettings, GenerateRequest, GenerateResponse, HistoryEntry } from '../shared/types';
import { IPC_CHANNELS } from '../shared/types';
import { checkOllamaStatus } from './llm/implementations/ollama';
import { createProviderEngine } from './llm/index';
import { generatePrompt, updateConfig } from './llm/orchestrator';
import { setWindowPosition } from './overlay';
import { StorageService } from './storage';
import { transcribeAudio } from './stt/whisper';

function validateId(id: string): void {
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('Invalid id: must be a non-empty string');
  }
}

function validateService(service: string): void {
  if (!PROVIDER_DEFINITIONS.some((p) => p.id === service)) {
    throw new Error(`Invalid service: '${service}'. Must be a registered provider.`);
  }
}

function validateTextLength(text: string, max = 100000): void {
  if (typeof text !== 'string' || text.length > max) {
    throw new Error(`Invalid text: must be a string with max ${max} characters`);
  }
}

// Extended type to handle both new providerConfigs format and legacy flat fields during migration
interface SettingsStore extends AppSettings {
  ollamaEndpoint?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  providerApiKeys?: Record<string, string>;
}

let settings: Partial<AppSettings> = {};
let storage: StorageService;
let tray: Tray | null = null;

export function registerIpcHandlers(win: BrowserWindow) {
  storage = new StorageService();

  // ── Load persisted settings on start ──
  settings = storage.loadSettings() as Partial<AppSettings>;
  updateConfig(settings);

  // ── System Tray ──
  createTray(win);

  // ── LLM ──
  ipcMain.handle(IPC_CHANNELS.LLM_GENERATE, async (_event, req: GenerateRequest): Promise<GenerateResponse> => {
    return await generatePrompt(req);
  });

  // ── Clipboard ──
  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_WRITE, (_event, text: string) => {
    validateTextLength(text);
    clipboard.writeText(text);
    return true;
  });

  // ── Window ──
  ipcMain.handle(IPC_CHANNELS.WINDOW_SET_BOUNDS, (_event, { x, y }: { x: number; y: number }) => {
    setWindowPosition(win, x, y);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_TOGGLE, () => {
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
      win.focus();
    }
    return win.isVisible();
  });

  // ── Window resize ──
  ipcMain.on(IPC_CHANNELS.WINDOW_RESIZE, (_event, width: number, height: number) => {
    const w = Math.max(200, Math.min(2000, Math.round(width)));
    const h = Math.max(200, Math.min(2000, Math.round(height)));
    win.setSize(w, h);
  });

  // ── Window Position (current position, used during drag) ──
  ipcMain.handle(IPC_CHANNELS.WINDOW_POS_GET, () => {
    const bounds = win.getBounds();
    return { x: bounds.x, y: bounds.y };
  });

  // ── Settings (in-memory) ──
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_event, newSettings: Partial<AppSettings>) => {
    // Security: validate that newSettings is a plain object to prevent prototype pollution
    if (typeof newSettings !== 'object' || newSettings === null || Array.isArray(newSettings)) {
      throw new Error('Settings must be a plain object');
    }
    settings = { ...settings, ...newSettings };
    updateConfig(settings);
    storage.saveSettings(settings as Record<string, unknown>);
    return true;
  });

  // ── Ollama ──
  ipcMain.handle(IPC_CHANNELS.OLLAMA_CHECK, async () => {
    const s = settings as SettingsStore;
    const ollamaConfig = s.providerConfigs?.ollama;
    const endpoint = ollamaConfig?.endpoint || s.ollamaEndpoint || 'http://localhost:11434';
    return await checkOllamaStatus(endpoint);
  });

  // ── STT (Whisper fallback) ──
  ipcMain.handle(IPC_CHANNELS.STT_START, async (_event, audioData: string) => {
    const s = settings as SettingsStore;
    const openaiApiKey = storage.getApiKey('openai') || s.providerApiKeys?.openai || '';
    if (!openaiApiKey) throw new Error('OpenAI API key not configured for STT');
    // Reject audio data larger than 25 MB (base64-encoded) to prevent memory exhaustion
    if (typeof audioData !== 'string' || audioData.length > 25 * 1024 * 1024) {
      throw new Error('Audio data too large (max 25 MB)');
    }
    return await transcribeAudio(audioData, openaiApiKey);
  });

  // ── Provider Check (dynamic connectivity test) ──
  ipcMain.handle(IPC_CHANNELS.PROVIDER_CHECK, async (_event, providerId: string) => {
    validateService(providerId);
    const engine = createProviderEngine({
      getApiKey: (service: string) => storage.getApiKey(service) || null,
    });
    return await engine.check({ providerId });
  });

  // ── History ──
  ipcMain.handle(IPC_CHANNELS.HISTORY_INSERT, (_event, entry: HistoryEntry) => {
    storage.insertHistory(entry);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_LIST, (_event, limit = 50, offset = 0) => {
    return storage.listHistory(limit, offset);
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_SEARCH, (_event, query: string) => {
    return storage.searchHistory(query);
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_DELETE, (_event, id: string) => {
    validateId(id);
    storage.deleteHistory(id);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_CLEAR, () => {
    storage.clearHistory();
    return true;
  });

  // ── Encrypted API Key Storage ──
  ipcMain.handle(IPC_CHANNELS.STORE_SAVE_API_KEY, (_event, service: string, apiKey: string) => {
    validateService(service);
    validateTextLength(apiKey, 4096);
    storage.saveApiKey(service, apiKey);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.STORE_HAS_API_KEY, (_event, service: string) => {
    validateService(service);
    return storage.hasApiKey(service);
  });

  ipcMain.handle(IPC_CHANNELS.APP_QUIT, () => {
    app.quit();
  });
}

function createTray(win: BrowserWindow) {
  // assets/ path works in dev (project root) and production (extraResources)
  const devPath = path.join(app.getAppPath(), 'assets/tray-icon.png');
  const prodPath = path.join(process.resourcesPath, 'assets/tray-icon.png');
  const iconPath = require('node:fs').existsSync(devPath) ? devPath : prodPath;
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  tray.setToolTip('Prompter');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show/Hide Prompter',
      click: () => {
        if (win.isVisible()) {
          win.hide();
        } else {
          win.show();
          win.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        tray?.destroy();
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
      win.focus();
    }
  });
}
