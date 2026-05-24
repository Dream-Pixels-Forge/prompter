import type { IpcRendererEvent } from 'electron';
import { contextBridge, ipcRenderer } from 'electron';
import type { AppSettings, GenerateRequest, HistoryEntry } from '../shared/types';
import { IPC_CHANNELS } from '../shared/types';

contextBridge.exposeInMainWorld('api', {
  llm: {
    generate: (req: GenerateRequest) => ipcRenderer.invoke(IPC_CHANNELS.LLM_GENERATE, req),
  },
  clipboard: {
    write: (text: string) => ipcRenderer.invoke(IPC_CHANNELS.CLIPBOARD_WRITE, text),
  },
  window: {
    setBounds: (bounds: { x: number; y: number }) => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_SET_BOUNDS, bounds),
    toggle: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_TOGGLE),
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
    set: (settings: Partial<AppSettings>) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, settings),
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
    clear: () => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_CLEAR),
  },
  store: {
    saveApiKey: (service: string, key: string) => ipcRenderer.invoke(IPC_CHANNELS.STORE_SAVE_API_KEY, service, key),
    getApiKey: (service: string) => ipcRenderer.invoke(IPC_CHANNELS.STORE_GET_API_KEY, service),
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
  bubble: {
    getPosition: () => ipcRenderer.invoke(IPC_CHANNELS.BUBBLE_POS_GET),
    setPosition: (pos: { bottom: number; right: number }) => ipcRenderer.invoke(IPC_CHANNELS.BUBBLE_POS_SET, pos),
  },
});
