import { saveApiKey } from '@/renderer/lib/llm';
import { PROVIDER_DEFINITIONS } from '@/shared/provider-definitions';
import type { AppSettings } from '@/shared/types';
import { create } from 'zustand';

interface SettingsStore {
  loaded: boolean;
  activeProvider: string;
  providerConfigs: Record<string, { model: string; endpoint?: string }>;
  /** Tracks which providers have an API key configured (boolean, never the actual key) */
  hasApiKeys: Record<string, boolean>;
  recentProviders: string[];
  version: number;
  hotkeyToggle: string;
  hotkeyMic: string;
  launchOnStartup: boolean;
  autoHideDelay: number;
  theme: 'dark' | 'light' | 'system';
  ollamaAvailable: boolean;
  ollamaModels: string[];

  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  saveSettings: () => Promise<void>;
  checkOllamaStatus: () => Promise<void>;
  saveProviderKey: (providerId: string, key: string) => Promise<void>;
}

const defaults: AppSettings = {
  activeProvider: 'ollama',
  providerConfigs: {
    ollama: { model: 'llama3.2', endpoint: 'http://localhost:11434' },
    openai: { model: 'gpt-4o' },
    anthropic: { model: 'claude-sonnet-4-20250514' },
  },
  recentProviders: ['ollama', 'openai', 'anthropic'],
  version: 1,
  hotkeyToggle: 'Alt+Space',
  hotkeyMic: 'Alt+M',
  launchOnStartup: false,
  autoHideDelay: 5,
  theme: 'dark',
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  loaded: false,
  activeProvider: defaults.activeProvider,
  providerConfigs: defaults.providerConfigs,
  hasApiKeys: {},
  recentProviders: defaults.recentProviders,
  version: defaults.version,
  hotkeyToggle: defaults.hotkeyToggle,
  hotkeyMic: defaults.hotkeyMic,
  launchOnStartup: defaults.launchOnStartup,
  autoHideDelay: defaults.autoHideDelay,
  theme: defaults.theme,
  ollamaAvailable: false,
  ollamaModels: [],

  loadSettings: async () => {
    try {
      const saved = (await window.api.settings.get()) as Partial<AppSettings> & Record<string, unknown>;

      // Version migration to v2 (new settings fields)
      if ((saved.version as number) < 2) {
        saved.version = 2;
        // Persist immediately to avoid re-running migration on crash
        await window.api.settings.set({
          ...saved,
          version: 2,
        } as AppSettings);
      }

      // Batch-check which providers have API keys in a single IPC call
      // instead of N individual calls (one per provider)
      const serviceIds = PROVIDER_DEFINITIONS.map((def) => def.id);
      const keyStatuses = await window.api.history.getKeyStatuses(serviceIds);

      // Merge saved providerConfigs with defaults — saved values override defaults
      const savedConfigs = (saved.providerConfigs as Record<string, { model: string; endpoint?: string }>) || {};
      const mergedConfigs: Record<string, { model: string; endpoint?: string }> = {};
      for (const def of PROVIDER_DEFINITIONS) {
        mergedConfigs[def.id] = {
          model: savedConfigs[def.id]?.model || def.defaultModel,
          endpoint: savedConfigs[def.id]?.endpoint || def.defaultEndpoint,
        };
      }
      // Add any saved providers not in definitions (custom providers)
      for (const [id, cfg] of Object.entries(savedConfigs)) {
        if (!mergedConfigs[id]) mergedConfigs[id] = cfg;
      }

      set({
        activeProvider: (saved.activeProvider as string) || defaults.activeProvider,
        providerConfigs: mergedConfigs,
        hasApiKeys: keyStatuses,
        recentProviders: (saved.recentProviders as string[]) || defaults.recentProviders,
        version: (saved.version as number) || 1,
        hotkeyToggle: (saved.hotkeyToggle as string) || defaults.hotkeyToggle,
        hotkeyMic: (saved.hotkeyMic as string) || defaults.hotkeyMic,
        launchOnStartup: (saved.launchOnStartup as boolean) ?? defaults.launchOnStartup,
        autoHideDelay: (saved.autoHideDelay as number) ?? defaults.autoHideDelay,
        theme: (saved.theme as 'dark' | 'light' | 'system') ?? defaults.theme,
        loaded: true,
      });
    } catch (err) {
      console.error('[settings] Failed to load settings:', err);
      set({ loaded: true });
    }
  },

  updateSetting: (key, value) => {
    set({ [key]: value });
  },

  saveSettings: async () => {
    try {
      const state = get();
      const settings: AppSettings = {
        activeProvider: state.activeProvider,
        providerConfigs: state.providerConfigs,
        recentProviders: state.recentProviders,
        version: state.version,
        hotkeyToggle: state.hotkeyToggle,
        hotkeyMic: state.hotkeyMic,
        launchOnStartup: state.launchOnStartup,
        autoHideDelay: state.autoHideDelay,
        theme: state.theme,
      };
      await window.api.settings.set(settings);
    } catch (err) {
      console.error('[settings] Failed to save settings:', err);
      throw err;
    }
  },

  checkOllamaStatus: async () => {
    try {
      const result = await window.api.ollama.check();
      set({ ollamaAvailable: result.available, ollamaModels: result.models ?? [] });
    } catch (err) {
      console.warn('[settings] Failed to check Ollama status:', err);
      set({ ollamaAvailable: false, ollamaModels: [] });
    }
  },

  saveProviderKey: async (providerId: string, key: string) => {
    await saveApiKey(providerId, key);
    set((state) => ({
      hasApiKeys: { ...state.hasApiKeys, [providerId]: true },
    }));
  },
}));
