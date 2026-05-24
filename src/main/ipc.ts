import type { BrowserWindow } from 'electron';
import { Menu, Tray, app, clipboard, ipcMain, nativeImage } from 'electron';
import path from 'node:path';
import type { AppSettings, GenerateRequest, GenerateResponse, HistoryEntry } from '../shared/types';
import { IPC_CHANNELS } from '../shared/types';
import { checkOllamaStatus } from './llm/ollama';
import { generatePrompt, updateConfig } from './llm/orchestrator';
import { setWindowPosition } from './overlay';
import { StorageService } from './storage';
import { transcribeAudio } from './stt/whisper';

const VALID_SERVICES = new Set(['openai', 'anthropic']);

function validateId(id: string): void {
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('Invalid id: must be a non-empty string');
  }
}

function validateService(service: string): void {
  if (!VALID_SERVICES.has(service)) {
    throw new Error(`Invalid service: must be one of [${[...VALID_SERVICES].join(', ')}]`);
  }
}

function validateTextLength(text: string, max = 100000): void {
  if (typeof text !== 'string' || text.length > max) {
    throw new Error(`Invalid text: must be a string with max ${max} characters`);
  }
}

let settings: Partial<AppSettings> = {};
let storage: StorageService;
let tray: Tray | null = null;

export function registerIpcHandlers(win: BrowserWindow) {
  storage = new StorageService();

  // ── Load non-sensitive settings on start (API keys loaded on demand from storage) ──
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

  // ── Settings (in-memory) ──
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_event, newSettings: Partial<AppSettings>) => {
    settings = { ...settings, ...newSettings };
    updateConfig(settings);
    return true;
  });

  // ── Ollama ──
  ipcMain.handle(IPC_CHANNELS.OLLAMA_CHECK, async () => {
    return await checkOllamaStatus(settings.ollamaEndpoint);
  });

  // ── STT (Whisper fallback) ──
  ipcMain.handle(IPC_CHANNELS.STT_START, async (_event, audioData: string) => {
    const openaiApiKey = storage.getApiKey('openai') || settings.openaiApiKey || '';
    if (!openaiApiKey) throw new Error('OpenAI API key not configured for STT');
    return await transcribeAudio(audioData, openaiApiKey);
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

  ipcMain.handle(IPC_CHANNELS.STORE_GET_API_KEY, (_event, service: string) => {
    return storage.getApiKey(service);
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
        win.isVisible() ? win.hide() : (win.show(), win.focus());
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
    win.isVisible() ? win.hide() : (win.show(), win.focus());
  });
}
