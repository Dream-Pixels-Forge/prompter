import { useEffect, useRef } from 'react';
import { Cpu, Key, Globe, Check, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '@/renderer/stores/settings-store';
import { useAppStore } from '@/renderer/stores/app-store';
import { type ProviderType } from '@/shared/types';
import type { AppSettings } from '@/shared/types';

const PROVIDERS: { type: ProviderType; label: string; description: string }[] = [
  { type: 'ollama', label: 'Ollama', description: 'Local LLM via Ollama server' },
  { type: 'openai', label: 'OpenAI', description: 'GPT-4o and GPT models' },
  { type: 'anthropic', label: 'Anthropic', description: 'Claude Sonnet & Haiku' },
];

export function SettingsPanel() {
  const store = useSettingsStore();
  const showToast = useAppStore((s) => s.showToast);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    store.loadSettings();
    store.checkOllamaStatus();
  }, []);

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    store.updateSetting(key, value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await store.saveSettings();
      showToast('Saved');
    }, 1000);
  };

  const handleSaveKey = async () => {
    await store.saveSettings();
    showToast('Saved');
  };

  return (
    <div className="space-y-4">
      {/* Provider Selection */}
      <div>
        <label className="text-xs text-white/40 mb-2 block">Provider</label>
        <div className="space-y-1.5">
          {PROVIDERS.map(({ type, label, description }) => (
            <button
              key={type}
              onClick={() => handleChange('activeProvider', type)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors text-left ${
                store.activeProvider === type
                  ? 'bg-[#2D4A7A]/20 border-[#4A7FA0]/40'
                  : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                store.activeProvider === type ? 'border-[#4A7FA0]' : 'border-white/20'
              }`}>
                {store.activeProvider === type && <div className="w-2 h-2 rounded-full bg-[#4A7FA0]" />}
              </div>
              <div className="min-w-0">
                <div className="text-sm text-white/80">{label}</div>
                <div className="text-xs text-white/40 truncate">{description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.06]" />

      {/* Ollama Configuration */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-white/40" />
          <span className="text-xs text-white/60 font-medium">Ollama</span>
          <button
            onClick={store.checkOllamaStatus}
            className="ml-auto px-2 py-0.5 text-[10px] bg-white/[0.06] hover:bg-white/[0.1] rounded transition-colors text-white/50"
          >
            Check Status
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 w-16 shrink-0">Endpoint</span>
          <input
            type="text"
            value={store.ollamaEndpoint}
            onChange={(e) => handleChange('ollamaEndpoint', e.target.value)}
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-[#4A7FA0]/40 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 w-16 shrink-0">Model</span>
          <input
            type="text"
            value={store.ollamaModel}
            onChange={(e) => handleChange('ollamaModel', e.target.value)}
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-[#4A7FA0]/40 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {store.ollamaAvailable ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs text-green-400/80">Ollama available</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs text-red-400/80">Ollama not available</span>
            </>
          )}
        </div>

        {store.ollamaAvailable && store.ollamaModels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {store.ollamaModels.map((model) => (
              <span key={model} className="px-2 py-0.5 text-[10px] bg-white/[0.06] rounded text-white/50">
                {model}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.06]" />

      {/* OpenAI Configuration */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-white/40" />
          <span className="text-xs text-white/60 font-medium">OpenAI</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 w-16 shrink-0">Model</span>
          <input
            type="text"
            value={store.openaiModel}
            onChange={(e) => handleChange('openaiModel', e.target.value)}
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-[#4A7FA0]/40 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 w-16 shrink-0">API Key</span>
          <div className="flex-1 flex items-center gap-2">
            <input
              type="password"
              value={store.openaiApiKey}
              onChange={(e) => handleChange('openaiApiKey', e.target.value)}
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-[#4A7FA0]/40 transition-colors"
            />
            <button
              onClick={handleSaveKey}
              className="flex items-center gap-1 px-2 py-1.5 text-[10px] bg-white/[0.06] hover:bg-white/[0.1] rounded transition-colors text-white/50 shrink-0"
            >
              <Key className="w-3 h-3" />
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.06]" />

      {/* Anthropic Configuration */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-white/40" />
          <span className="text-xs text-white/60 font-medium">Anthropic</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 w-16 shrink-0">Model</span>
          <input
            type="text"
            value={store.anthropicModel}
            onChange={(e) => handleChange('anthropicModel', e.target.value)}
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-[#4A7FA0]/40 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 w-16 shrink-0">API Key</span>
          <div className="flex-1 flex items-center gap-2">
            <input
              type="password"
              value={store.anthropicApiKey}
              onChange={(e) => handleChange('anthropicApiKey', e.target.value)}
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white/80 placeholder-white/20 focus:outline-none focus:border-[#4A7FA0]/40 transition-colors"
            />
            <button
              onClick={handleSaveKey}
              className="flex items-center gap-1 px-2 py-1.5 text-[10px] bg-white/[0.06] hover:bg-white/[0.1] rounded transition-colors text-white/50 shrink-0"
            >
              <Key className="w-3 h-3" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
