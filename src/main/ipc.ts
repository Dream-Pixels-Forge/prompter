import { ipcMain, BrowserWindow, clipboard, Tray, Menu, nativeImage, app } from 'electron';
import path from 'path';
import {
  IPC_CHANNELS,
  type GenerateRequest,
  type GenerateResponse,
  type AppSettings,
  type HistoryEntry,
} from '../shared/types';
import { generatePrompt, updateConfig } from './llm/orchestrator';
import { checkOllamaStatus } from './llm/ollama';
import { setWindowPosition } from './overlay';
import { transcribeAudio } from './stt/whisper';
import { StorageService } from './storage';

let settings: Partial<AppSettings> = {};
let storage: StorageService;
let tray: Tray | null = null;

export function registerIpcHandlers(win: BrowserWindow) {
  storage = new StorageService();

  // ── Load persisted API keys into memory on start ──
  const savedKeys = storage.getAllApiKeys();
  if (savedKeys.openai) settings.openaiApiKey = savedKeys.openai;
  if (savedKeys.anthropic) settings.anthropicApiKey = savedKeys.anthropic;
  if (Object.keys(savedKeys).length > 0) {
    updateConfig(settings);
  }

  // ── System Tray ──
  createTray(win);

  // ── LLM ──
  ipcMain.handle(IPC_CHANNELS.LLM_GENERATE, async (_event, req: GenerateRequest): Promise<GenerateResponse> => {
    return await generatePrompt(req);
  });

  // ── Clipboard ──
  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_WRITE, (_event, text: string) => {
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
    const ollamaEndpoint = (settings as any)?.ollamaEndpoint;
    return await checkOllamaStatus(ollamaEndpoint);
  });

  // ── STT (Whisper fallback) ──
  ipcMain.handle(IPC_CHANNELS.STT_START, async (_event, audioData: string) => {
    const openaiApiKey = (settings as any)?.openaiApiKey;
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
    storage.deleteHistory(id);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_CLEAR, () => {
    storage.clearHistory();
    return true;
  });

  // ── Encrypted API Key Storage ──
  ipcMain.handle(IPC_CHANNELS.STORE_SAVE_API_KEY, (_event, service: string, apiKey: string) => {
    storage.saveApiKey(service, apiKey);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.STORE_GET_API_KEY, (_event, service: string) => {
    return storage.getApiKey(service);
  });
}

function createTray(win: BrowserWindow) {
  const iconPath = path.join(app.getAppPath(), 'assets/tray-icon.png');
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
