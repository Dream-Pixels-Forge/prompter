import { hasApiKey as checkKeyExists, saveApiKey } from '@/renderer/lib/llm';
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
  ollamaAvailable: false,
  ollamaModels: [],

  loadSettings: async () => {
    const saved = (await window.api.settings.get()) as Partial<AppSettings> & Record<string, unknown>;

    // Migration from old flat format (version === undefined)
    if (saved.version === undefined) {
      const migrated: Record<string, { model: string; endpoint?: string }> = {};
      if (saved.ollamaModel) {
        migrated.ollama = {
          model: saved.ollamaModel as string,
          endpoint: (saved.ollamaEndpoint as string) || undefined,
        };
      }
      if (saved.openaiModel) migrated.openai = { model: saved.openaiModel as string };
      if (saved.anthropicModel) migrated.anthropic = { model: saved.anthropicModel as string };
      saved.providerConfigs = migrated;
      saved.version = 1;
      saved.recentProviders = ['ollama', 'openai', 'anthropic'].filter((id) => migrated[id]);
    }

    // Check which providers have API keys (boolean only — actual keys never enter the renderer)
    const keyEntries = await Promise.all(
      PROVIDER_DEFINITIONS.map(async (def) => [def.id, await checkKeyExists(def.id)] as [string, boolean]),
    );
    const hasApiKeys: Record<string, boolean> = {};
    for (const [id, exists] of keyEntries) {
      if (exists) hasApiKeys[id] = true;
    }

    set({
      activeProvider: (saved.activeProvider as string) || defaults.activeProvider,
      providerConfigs: (saved.providerConfigs as Record<string, { model: string; endpoint?: string }>) || {},
      hasApiKeys,
      recentProviders: (saved.recentProviders as string[]) || defaults.recentProviders,
      version: (saved.version as number) || 1,
      hotkeyToggle: (saved.hotkeyToggle as string) || defaults.hotkeyToggle,
      hotkeyMic: (saved.hotkeyMic as string) || defaults.hotkeyMic,
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
      providerConfigs: state.providerConfigs,
      recentProviders: state.recentProviders,
      version: state.version,
      hotkeyToggle: state.hotkeyToggle,
      hotkeyMic: state.hotkeyMic,
    };
    await window.api.settings.set(settings);
  },

  checkOllamaStatus: async () => {
    const result = await window.api.ollama.check();
    set({ ollamaAvailable: result.available, ollamaModels: result.models ?? [] });
  },

  saveProviderKey: async (providerId: string, _key: string) => {
    await saveApiKey(providerId, _key);
    set((state) => ({
      hasApiKeys: { ...state.hasApiKeys, [providerId]: true },
    }));
  },
}));
