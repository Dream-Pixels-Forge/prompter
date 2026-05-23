import { ipcMain, BrowserWindow, clipboard } from 'electron';
import { IPC_CHANNELS, type GenerateRequest, type GenerateResponse, type AppSettings } from '../shared/types';
import { generatePrompt, updateConfig } from './llm/orchestrator';
import { checkOllamaStatus } from './llm/ollama';
import { setWindowPosition } from './overlay';
import { transcribeAudio } from './stt/whisper';

let settings: Partial<AppSettings> = {};

export function registerIpcHandlers(win: BrowserWindow) {
  ipcMain.handle(IPC_CHANNELS.LLM_GENERATE, async (_event, req: GenerateRequest): Promise<GenerateResponse> => {
    return await generatePrompt(req);
  });

  ipcMain.handle(IPC_CHANNELS.CLIPBOARD_WRITE, (_event, text: string) => {
    clipboard.writeText(text);
    return true;
  });

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

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_event, newSettings: Partial<AppSettings>) => {
    settings = { ...settings, ...newSettings };
    updateConfig(settings);
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.OLLAMA_CHECK, async () => {
    const ollamaEndpoint = (settings as any)?.ollamaEndpoint;
    return await checkOllamaStatus(ollamaEndpoint);
  });

  ipcMain.handle(IPC_CHANNELS.STT_START, async (_event, audioData: string) => {
    const openaiApiKey = (settings as any)?.openaiApiKey;
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured for STT');
    }
    return await transcribeAudio(audioData, openaiApiKey);
  });
}
