import * as fs from 'node:fs';
import * as fsAsync from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { type BrowserWindow, Menu, Tray, app, clipboard, dialog, globalShortcut, ipcMain, nativeImage } from 'electron';
import { getFramework } from '../shared/frameworks';
import { PROVIDER_DEFINITIONS } from '../shared/provider-definitions';
import type { AppSettings, GenerateRequest, GenerateResponse, HistoryEntry } from '../shared/types';
import { IPC_CHANNELS } from '../shared/types';
import { checkOllamaStatus } from './llm/implementations/ollama';

import { createProviderEngine, getEngine } from './llm/index';
import { generatePrompt, getConfig, updateConfig } from './llm/orchestrator';
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

function validateEndpoint(url: string): void {
  if (typeof url !== 'string' || !url.trim()) return; // empty is fine (uses default)
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid endpoint URL: '${url}'`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Endpoint must use http or https protocol, got '${parsed.protocol}'`);
  }
}



let settings: Partial<AppSettings> = {};
let storage: StorageService;
let tray: Tray | null = null;

/** Get current hotkey settings (read after settings are loaded) */
export function getHotkeys(): { toggle: string; mic: string } {
  return {
    toggle: (settings as AppSettings).hotkeyToggle || 'Alt+Space',
    mic: (settings as AppSettings).hotkeyMic || 'Alt+M',
  };
}

/**
 * Per-request abort controllers — keyed by requestId so LLM_CANCEL can target a specific
 * request instead of blindly clearing all controllers.
 */
const abortControllers = new Map<string, AbortController>();

/** Track current hotkey accelerators so we can unregister before re-registering */
let currentToggleHotkey: string | null = null;
let currentMicHotkey: string | null = null;

/** Register all hotkeys, unregistering old ones first */
export function registerAllHotkeys(win: BrowserWindow): void {
  const hotkeys = getHotkeys();

  // Unregister old hotkeys if they exist
  if (currentToggleHotkey) {
    try { globalShortcut.unregister(currentToggleHotkey); } catch { /* ignore */ }
  }
  if (currentMicHotkey) {
    try { globalShortcut.unregister(currentMicHotkey); } catch { /* ignore */ }
  }

  currentToggleHotkey = hotkeys.toggle;
  currentMicHotkey = hotkeys.mic;

  registerHotkey(hotkeys.toggle, () => {
    if (win) {
      win.isVisible() ? win.hide() : win.show();
    }
  });
  registerHotkey(hotkeys.mic, () => {
    if (win?.isVisible()) {
      win.webContents.send(IPC_CHANNELS.HOTKEY_TRIGGERED, 'toggle-mic');
    }
  });
}

/** Register a single global hotkey, logging failure instead of crashing */
function registerHotkey(accelerator: string, callback: () => void): void {
  try {
    globalShortcut.register(accelerator, callback);
  } catch (err) {
    console.error(`[Hotkey] Failed to register '${accelerator}':`, err);
  }
}

// ── Settings write debounce ────────────────────────────
// Prevents rapid-fire settings updates from causing race conditions on disk.
let settingsWriteTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSettings: Record<string, unknown> | null = null;

function debouncedSaveSettings(settingsToSave: Record<string, unknown>): void {
  pendingSettings = settingsToSave;
  if (settingsWriteTimer) clearTimeout(settingsWriteTimer);
  settingsWriteTimer = setTimeout(async () => {
    if (pendingSettings) {
      storage.saveSettings(pendingSettings);
      pendingSettings = null;
    }
  }, 300);
}

export function registerIpcHandlers(win: BrowserWindow) {
  storage = new StorageService();

  // ── Load persisted settings on start ──
  settings = storage.loadSettings() as Partial<AppSettings>;
  updateConfig(settings);

  // ── System Tray ──
  createTray(win);

  // ── App Version ──
  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, () => {
    return app.getVersion();
  });

  // ── LLM ──
  ipcMain.handle(IPC_CHANNELS.LLM_GENERATE, async (_event, req: GenerateRequest): Promise<GenerateResponse & { requestId: string }> => {
    // Validate request shape before passing to orchestrator
    if (!req || typeof req.input !== 'string' || !req.input.trim()) {
      throw new Error('Invalid request: input is required');
    }
    if (req.framework && typeof req.framework !== 'string') {
      throw new Error('Invalid request: framework must be a string');
    }
    if (req.template && typeof req.template !== 'string') {
      throw new Error('Invalid request: template must be a string');
    }
    if (req.framework && !getFramework(req.framework)) {
      throw new Error(`Invalid request: unknown framework '${req.framework}'`);
    }
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const controller = new AbortController();
    abortControllers.set(requestId, controller);
    try {
      const result = await generatePrompt(req, controller.signal);
      return { ...result, requestId };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('CANCELLED');
      }
      throw err;
    } finally {
      abortControllers.delete(requestId);
    }
  });

  // Cancel a specific request by ID, or all if no ID provided (legacy compat)
  ipcMain.handle(IPC_CHANNELS.LLM_CANCEL, (_event, requestId?: string) => {
    if (requestId) {
      const controller = abortControllers.get(requestId);
      if (controller) {
        controller.abort();
        abortControllers.delete(requestId);
      }
    } else {
      // Cancel all in-flight requests (used by global cancel button)
      for (const controller of abortControllers.values()) {
        controller.abort();
      }
      abortControllers.clear();
    }
    return true;
  });

  // ── Clipboard ──
  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_WRITE, (_event, text: string) => {
    validateTextLength(text);
    clipboard.writeText(text);
    return true;
  });

  // ── Window ──
  ipcMain.handle(IPC_CHANNELS.WINDOW_SET_BOUNDS, (_event, { x, y }: { x: number; y: number }) => {
    if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) return false;
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
    if (typeof width !== 'number' || typeof height !== 'number' || !Number.isFinite(width) || !Number.isFinite(height)) return;
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
    // Return orchestrator config as the single source of truth, merged with persisted settings
    const runtimeConfig = getConfig();
    return { ...settings, ...runtimeConfig };
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_event, newSettings: Partial<AppSettings>) => {
    // Security: validate that newSettings is a plain object to prevent prototype pollution
    if (typeof newSettings !== 'object' || newSettings === null || Array.isArray(newSettings)) {
      throw new Error('Settings must be a plain object');
    }
    // Validate against allowed keys to prevent injection of arbitrary properties
    const allowedKeys = new Set<keyof AppSettings>([
      'activeProvider',
      'providerConfigs',
      'recentProviders',
      'version',
      'hotkeyToggle',
      'hotkeyMic',
      'launchOnStartup',
      'autoHideDelay',
      'theme',
    ]);
    for (const key of Object.keys(newSettings)) {
      if (!allowedKeys.has(key as keyof AppSettings)) {
        throw new Error(`Unknown setting: '${key}'`);
      }
    }
    // Validate endpoint URLs in providerConfigs to prevent SSRF
    if (newSettings.providerConfigs && typeof newSettings.providerConfigs === 'object') {
      for (const [providerId, cfg] of Object.entries(newSettings.providerConfigs)) {
        if (cfg && typeof cfg === 'object' && 'endpoint' in cfg) {
          validateEndpoint((cfg as { endpoint?: string }).endpoint ?? '');
        }
      }
    }
    settings = { ...settings, ...newSettings };
    updateConfig(settings);

    // Debounced write to avoid race conditions from rapid settings changes
    debouncedSaveSettings(settings as Record<string, unknown>);

    // Re-register hotkeys if they changed
    if (newSettings.hotkeyToggle || newSettings.hotkeyMic) {
      registerAllHotkeys(win);
    }

    // Apply launch-on-startup setting immediately (no debounce — OS-level effect)
    if ('launchOnStartup' in newSettings) {
      app.setLoginItemSettings({ openAtLogin: !!newSettings.launchOnStartup });
    }

    return true;
  });

  // ── Ollama ──
  ipcMain.handle(IPC_CHANNELS.OLLAMA_CHECK, async () => {
    const ollamaConfig = settings.providerConfigs?.ollama;
    const endpoint = ollamaConfig?.endpoint || 'http://localhost:11434';
    return await checkOllamaStatus(endpoint);
  });

  // ── STT (Whisper fallback) ──
  ipcMain.handle(IPC_CHANNELS.STT_START, async (_event, audioData: string) => {
    const openaiApiKey = storage.getApiKey('openai');
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
    const engine = getEngine();
    return await engine.check({ providerId });
  });

  // ── Batch API key status check (single IPC call instead of N calls) ──
  ipcMain.handle(IPC_CHANNELS.HISTORY_KEY_STATUS, (_event, services: string[]) => {
    for (const s of services) {
      validateService(s);
    }
    return storage.getApiKeyStatuses(services);
  });

  // ── History ──
  ipcMain.handle(IPC_CHANNELS.HISTORY_INSERT, (_event, entry: HistoryEntry) => {
    // Validate entry structure to prevent data injection
    if (!entry || typeof entry !== 'object') throw new Error('Invalid history entry');
    if (!entry.id || typeof entry.id !== 'string') throw new Error('History entry must have a string id');
    if (typeof entry.rawInput !== 'string') throw new Error('History entry must have rawInput string');
    if (typeof entry.structuredOutput !== 'string') throw new Error('History entry must have structuredOutput string');
    if (typeof entry.createdAt !== 'string') throw new Error('History entry must have createdAt string');
    storage.insertHistory(entry);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_LIST, (_event, limit = 50, offset = 0) => {
    // Clamp to prevent abuse
    const safeLimit = Math.max(0, Math.min(200, Math.floor(Number(limit) || 50)));
    const safeOffset = Math.max(0, Math.floor(Number(offset) || 0));
    return storage.listHistory(safeLimit, safeOffset);
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_SEARCH, (_event, query: string) => {
    if (typeof query !== 'string') return [];
    return storage.searchHistory(query.slice(0, 500)); // limit query length
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_DELETE, (_event, id: string) => {
    validateId(id);
    storage.deleteHistory(id);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_CLEAR, (_event, confirmed?: boolean) => {
    if (!confirmed) throw new Error('Confirmation required — pass confirmed: true');
    storage.clearHistory();
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.HISTORY_EXPORT, async () => {
    const result = await dialog.showSaveDialog(win, {
      defaultPath: `prompter-history-${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (result.canceled || !result.filePath) return null;

    const allHistory = storage.listHistory(500, 0);
    await fsAsync.writeFile(result.filePath, JSON.stringify(allHistory, null, 2), 'utf-8');
    return result.filePath;
  });

  // ── Encrypted API Key Storage ──
  ipcMain.handle(IPC_CHANNELS.STORE_SAVE_API_KEY, async (_event, service: string, apiKey: string) => {
    validateService(service);
    validateTextLength(apiKey, 4096);
    await storage.saveApiKey(service, apiKey);
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

  const iconPath = existsSync(devPath) ? devPath : existsSync(prodPath) ? prodPath : null;

  // Fallback: create a minimal 16x16 tray icon in memory if file is missing
  if (!iconPath) {
    console.warn('[Tray] tray-icon.png not found, using fallback icon');
    const fallbackIcon = nativeImage.createEmpty();
    tray = new Tray(fallbackIcon);
  } else {
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon);
  }

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
      label: 'Toggle Mic Recording',
      click: () => {
        win.webContents.send(IPC_CHANNELS.HOTKEY_TRIGGERED, 'toggle-mic');
      },
    },
    {
      label: 'Quick Capture',
      click: () => {
        win.webContents.send(IPC_CHANNELS.TRAY_NAVIGATE, 'compose');
        win.show();
        win.focus();
      },
    },
    {
      label: 'Recent History',
      click: () => {
        win.webContents.send(IPC_CHANNELS.TRAY_NAVIGATE, 'history');
        win.show();
        win.focus();
      },
    },
    {
      label: 'Settings',
      click: () => {
        win.webContents.send(IPC_CHANNELS.TRAY_NAVIGATE, 'settings');
        win.show();
        win.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        // biome-ignore lint/suspicious/noExplicitAny: Electron App type omits isQuitting
        (app as any).isQuitting = true;
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
