import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types';

contextBridge.exposeInMainWorld('api', {
  llm: {
    generate: (req: any) => ipcRenderer.invoke(IPC_CHANNELS.LLM_GENERATE, req),
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
    set: (settings: any) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, settings),
  },
  ollama: {
    check: () => ipcRenderer.invoke(IPC_CHANNELS.OLLAMA_CHECK),
  },
});
