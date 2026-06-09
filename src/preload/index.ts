import type { IpcRendererEvent } from 'electron';
import { contextBridge, ipcRenderer } from 'electron';
import type { PrompterApi } from '../shared/api-types';
import type { AppSettings, AppTab, GenerateRequest, HistoryEntry } from '../shared/types';
import { IPC_CHANNELS } from '../shared/types';

contextBridge.exposeInMainWorld('api', {
  llm: {
    generate: (req: GenerateRequest) => ipcRenderer.invoke(IPC_CHANNELS.LLM_GENERATE, req),
    cancel: (requestId?: string) => ipcRenderer.invoke(IPC_CHANNELS.LLM_CANCEL, requestId),
  },
  clipboard: {
    write: (text: string) => ipcRenderer.invoke(IPC_CHANNELS.CLIPBOARD_WRITE, text),
  },
  window: {
    setBounds: (bounds: { x: number; y: number }) => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_SET_BOUNDS, bounds),
    toggle: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_TOGGLE),
    resize: (width: number, height: number) => ipcRenderer.send(IPC_CHANNELS.WINDOW_RESIZE, width, height),
    getPosition: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_POS_GET),
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
    set: (settings: Partial<AppSettings>) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, settings),
  },
  provider: {
    check: (providerId: string) => ipcRenderer.invoke(IPC_CHANNELS.PROVIDER_CHECK, providerId),
  },
  ollama: {
    check: () => ipcRenderer.invoke(IPC_CHANNELS.OLLAMA_CHECK),
  },
  stt: {
    transcribe: (audioData: string) => ipcRenderer.invoke(IPC_CHANNELS.STT_START, audioData),
  },
  history: {
    insert: (entry: HistoryEntry) => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_INSERT, entry),
    list: (limit?: number, offset?: number) => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_LIST, limit, offset),
    search: (query: string) => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_SEARCH, query),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_DELETE, id),
    clear: (confirmed?: boolean) => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_CLEAR, confirmed),
    exportAll: () => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_EXPORT),
    /** Batch-check which services have API keys (single IPC call instead of N) */
    getKeyStatuses: (services: string[]) => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_KEY_STATUS, services),
  },
  store: {
    saveApiKey: (service: string, key: string) => ipcRenderer.invoke(IPC_CHANNELS.STORE_SAVE_API_KEY, service, key),
    hasApiKey: (service: string) => ipcRenderer.invoke(IPC_CHANNELS.STORE_HAS_API_KEY, service),
  },
  hotkey: {
    onTriggered: (callback: (action: string) => void) => {
      const handler = (_event: IpcRendererEvent, action: string) => callback(action);
      ipcRenderer.on(IPC_CHANNELS.HOTKEY_TRIGGERED, handler);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.HOTKEY_TRIGGERED, handler);
      };
    },
  },
  tray: {
    onNavigate: (callback: (tab: AppTab) => void) => {
      const handler = (_event: IpcRendererEvent, tab: AppTab) => callback(tab);
      ipcRenderer.on(IPC_CHANNELS.TRAY_NAVIGATE, handler);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.TRAY_NAVIGATE, handler);
      };
    },
  },
  app: {
    quit: () => ipcRenderer.invoke(IPC_CHANNELS.APP_QUIT),
    getVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
  },
} satisfies PrompterApi);
