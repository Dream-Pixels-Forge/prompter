import { useEffect, useRef } from 'react';
import { Cpu, Key, Globe, Check, AlertCircle, Server, ChevronRight } from 'lucide-react';
import { useSettingsStore } from '@/renderer/stores/settings-store';
import { useAppStore } from '@/renderer/stores/app-store';
import { type ProviderType } from '@/shared/types';
import type { AppSettings } from '@/shared/types';

const PROVIDERS: { type: ProviderType; label: string; description: string }[] = [
  { type: 'ollama', label: 'Ollama', description: 'Local LLM via Ollama server' },
  { type: 'openai', label: 'OpenAI', description: 'GPT-4o and GPT models' },
  { type: 'anthropic', label: 'Anthropic', description: 'Claude Sonnet & Haiku' },
];

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-center gap-3">
      <span className="text-[11px] text-white/40 font-medium">{label}</span>
      {children}
    </div>
  );
}

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
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Server className="w-3.5 h-3.5 text-white/35" />
          <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Provider</span>
        </div>
        <div className="space-y-1.5">
          {PROVIDERS.map(({ type, label, description }) => (
            <button
              key={type}
              onClick={() => handleChange('activeProvider', type)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all text-left ${
                store.activeProvider === type
                  ? 'bg-[#2D4A7A]/15 border-[#4A7FA0]/40 shadow-sm'
                  : 'sub-card hover:border-white/[0.1]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                store.activeProvider === type ? 'border-[#4A7FA0]' : 'border-white/15'
              }`}>
                {store.activeProvider === type && (
                  <div className="w-2 h-2 rounded-full bg-[#4A7FA0]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-white/80 font-medium">{label}</div>
                <div className="text-[11px] text-white/35 truncate">{description}</div>
              </div>
              {store.activeProvider === type && (
                <ChevronRight className="w-3.5 h-3.5 text-[#4A7FA0]/60 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </section>

      <div className="border-t border-white/[0.06]" />

      {/* Ollama Configuration */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-white/35" />
          <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Ollama</span>
          <button onClick={store.checkOllamaStatus}
            className="btn-subtle ml-auto text-[10px]">
            Check
          </button>
        </div>

        <div className="space-y-2.5">
          <FormRow label="Endpoint">
            <input type="text" value={store.ollamaEndpoint}
              onChange={(e) => handleChange('ollamaEndpoint', e.target.value)}
              className="input-base w-full text-xs" />
          </FormRow>
          <FormRow label="Model">
            <input type="text" value={store.ollamaModel}
              onChange={(e) => handleChange('ollamaModel', e.target.value)}
              className="input-base w-full text-xs" />
          </FormRow>
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
              <span key={model}
                className="px-2 py-0.5 text-[10px] bg-white/[0.05] rounded-md text-white/45 font-mono">
                {model}
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="border-t border-white/[0.06]" />

      {/* OpenAI Configuration */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-white/35" />
          <span className="text-xs font-medium text-white/60 uppercase tracking-wider">OpenAI</span>
        </div>

        <div className="space-y-2.5">
          <FormRow label="Model">
            <input type="text" value={store.openaiModel}
              onChange={(e) => handleChange('openaiModel', e.target.value)}
              className="input-base w-full text-xs" />
          </FormRow>
          <FormRow label="API Key">
            <div className="flex items-center gap-2">
              <input type="password" value={store.openaiApiKey}
                onChange={(e) => handleChange('openaiApiKey', e.target.value)}
                className="input-base flex-1 text-xs" />
              <button onClick={handleSaveKey}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] bg-white/[0.06] hover:bg-white/[0.1] rounded-lg transition-colors text-white/50 shrink-0">
                <Key className="w-3 h-3" />
                Save
              </button>
            </div>
          </FormRow>
        </div>
      </section>

      <div className="border-t border-white/[0.06]" />

      {/* Anthropic Configuration */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-white/35" />
          <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Anthropic</span>
        </div>

        <div className="space-y-2.5">
          <FormRow label="Model">
            <input type="text" value={store.anthropicModel}
              onChange={(e) => handleChange('anthropicModel', e.target.value)}
              className="input-base w-full text-xs" />
          </FormRow>
          <FormRow label="API Key">
            <div className="flex items-center gap-2">
              <input type="password" value={store.anthropicApiKey}
                onChange={(e) => handleChange('anthropicApiKey', e.target.value)}
                className="input-base flex-1 text-xs" />
              <button onClick={handleSaveKey}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] bg-white/[0.06] hover:bg-white/[0.1] rounded-lg transition-colors text-white/50 shrink-0">
                <Key className="w-3 h-3" />
                Save
              </button>
            </div>
          </FormRow>
        </div>
      </section>
    </div>
  );
}
