import { getApiKey, saveApiKey } from '@/renderer/lib/llm';
import type { AppSettings, ProviderType } from '@/shared/types';
import { create } from 'zustand';

interface SettingsStore extends AppSettings {
  loaded: boolean;
  ollamaAvailable: boolean;
  ollamaModels: string[];

  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  saveSettings: () => Promise<void>;
  checkOllamaStatus: () => Promise<void>;
  getActiveLLMConfig: () => { provider: ProviderType; model: string; baseUrl?: string; apiKey?: string };
}

const defaults: AppSettings = {
  activeProvider: 'ollama',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
  openaiModel: 'gpt-4o',
  openaiApiKey: '',
  anthropicModel: 'claude-sonnet-4-20250514',
  anthropicApiKey: '',
  hotkeyToggle: 'Alt+Space',
  hotkeyMic: 'Alt+M',
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...defaults,
  loaded: false,
  ollamaAvailable: false,
  ollamaModels: [],

  loadSettings: async () => {
    const saved = await window.api.settings.get();
    // Also load persisted API keys from encrypted storage
    const [openaiKey, anthropicKey] = await Promise.all([getApiKey('openai'), getApiKey('anthropic')]);
    set({
      ...defaults,
      ...saved,
      openaiApiKey: openaiKey || saved.openaiApiKey || '',
      anthropicApiKey: anthropicKey || saved.anthropicApiKey || '',
      loaded: true,
    });
  },

  updateSetting: (key, value) => {
    set({ [key]: value });
  },

  saveSettings: async () => {
    const state = get();
    const settings: AppSettings = {
      activeProvider: state.activeProvider,
      ollamaEndpoint: state.ollamaEndpoint,
      ollamaModel: state.ollamaModel,
      openaiModel: state.openaiModel,
      openaiApiKey: state.openaiApiKey,
      anthropicModel: state.anthropicModel,
      anthropicApiKey: state.anthropicApiKey,
      hotkeyToggle: state.hotkeyToggle,
      hotkeyMic: state.hotkeyMic,
    };
    await window.api.settings.set(settings);
    if (settings.openaiApiKey) {
      await saveApiKey('openai', settings.openaiApiKey);
    }
    if (settings.anthropicApiKey) {
      await saveApiKey('anthropic', settings.anthropicApiKey);
    }
  },

  checkOllamaStatus: async () => {
    const result = await window.api.ollama.check();
    set({ ollamaAvailable: result.available, ollamaModels: result.models ?? [] });
  },

  getActiveLLMConfig: () => {
    const state = get();
    const config: { provider: ProviderType; model: string; baseUrl?: string; apiKey?: string } = {
      provider: state.activeProvider,
      model: '',
    };
    switch (state.activeProvider) {
      case 'ollama':
        config.model = state.ollamaModel;
        config.baseUrl = state.ollamaEndpoint;
        break;
      case 'openai':
        config.model = state.openaiModel;
        config.apiKey = state.openaiApiKey;
        break;
      case 'anthropic':
        config.model = state.anthropicModel;
        config.apiKey = state.anthropicApiKey;
        break;
    }
    return config;
  },
}));
