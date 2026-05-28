import { useAppStore } from '@/renderer/stores/app-store';
import { useSettingsStore } from '@/renderer/stores/settings-store';
import { ANTHROPIC_MODELS, type AppSettings, OPENAI_MODELS, type ProviderType } from '@/shared/types';
import { ChevronDown, Cpu, Globe, Key, Server } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

function ModelDropdown({
  value,
  options,
  onChange,
}: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-base w-full appearance-none cursor-pointer pr-7 text-xs"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/48" />
    </div>
  );
}

const PROVIDERS: { type: ProviderType; label: string; description: string }[] = [
  { type: 'ollama', label: 'Ollama', description: 'Local LLM via Ollama server' },
  { type: 'openai', label: 'OpenAI', description: 'GPT-4o and GPT models' },
  { type: 'anthropic', label: 'Anthropic', description: 'Claude Sonnet & Haiku' },
];

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[70px_1fr] items-center gap-2">
      <span className="text-[11px] text-white/48 font-medium">{label}</span>
      {children}
    </div>
  );
}

export function SettingsPanel() {
  const store = useSettingsStore();
  const showToast = useAppStore((s) => s.showToast);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [providerOpen, setProviderOpen] = useState(false);
  const providerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    store.loadSettings();
    store.checkOllamaStatus();
  }, [store]);

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    store.updateSetting(key, value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await store.saveSettings();
        showToast('Saved');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Save failed');
      }
    }, 1000);
  };

  const handleSaveKey = async () => {
    try {
      await store.saveSettings();
      showToast('Saved');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed');
    }
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (providerRef.current && !providerRef.current.contains(e.target as Node)) {
        setProviderOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const activeProvider = PROVIDERS.find((p) => p.type === store.activeProvider) ?? PROVIDERS[0];

  return (
    <div className="space-y-3">
      {/* Provider Selection — compact dropdown */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Server className="w-3.5 h-3.5 text-white/48" />
          <span className="text-xs font-medium text-white/68 uppercase tracking-wider">Provider</span>
        </div>
        <div ref={providerRef} className="relative">
          <button
            type="button"
            onClick={() => setProviderOpen(!providerOpen)}
            className="w-full flex items-center gap-2.5 px-3 py-2 sub-card hover:border-white/[0.1] transition-all text-left"
          >
            <div className="w-4 h-4 rounded-full border-2 border-accent flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full bg-accent" />
            </div>
            <span className="text-sm text-white/80 font-medium flex-1">{activeProvider.label}</span>
            <span className="text-[11px] text-white/48">{activeProvider.description}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-white/48 transition-transform ${providerOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {providerOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-xl overflow-hidden z-50">
              {PROVIDERS.map(({ type, label, description }) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => {
                    handleChange('activeProvider', type);
                    setProviderOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    type === store.activeProvider
                      ? 'bg-brand-500/15 text-white'
                      : 'text-white/68 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      type === store.activeProvider ? 'border-accent' : 'border-white/15'
                    }`}
                  >
                    {type === store.activeProvider && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium">{label}</div>
                    <div className="text-[10px] text-white/48 truncate">{description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="border-t border-white/[0.06]" />

      {/* Ollama Configuration */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-white/48" />
          <span className="text-xs font-medium text-white/68 uppercase tracking-wider">Ollama</span>
          <button type="button" onClick={store.checkOllamaStatus} className="btn-subtle ml-auto text-[10px]">
            Check
          </button>
        </div>

        <div className="space-y-2">
          <FormRow label="Endpoint">
            <input
              type="text"
              value={store.ollamaEndpoint}
              onChange={(e) => handleChange('ollamaEndpoint', e.target.value)}
              className="input-base w-full text-xs"
            />
          </FormRow>
          <FormRow label="Model">
            {store.ollamaModels.length > 0 ? (
              <ModelDropdown
                value={store.ollamaModel}
                options={store.ollamaModels}
                onChange={(v) => handleChange('ollamaModel', v)}
              />
            ) : (
              <input
                type="text"
                value={store.ollamaModel}
                onChange={(e) => handleChange('ollamaModel', e.target.value)}
                className="input-base w-full text-xs"
              />
            )}
          </FormRow>
        </div>
      </section>

      <div className="border-t border-white/[0.06]" />

      {/* OpenAI Configuration */}
      <section className="space-y-2.5">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-white/48" />
          <span className="text-xs font-medium text-white/68 uppercase tracking-wider">OpenAI</span>
        </div>

        <div className="space-y-2">
          <FormRow label="Model">
            <ModelDropdown
              value={store.openaiModel}
              options={OPENAI_MODELS}
              onChange={(v) => handleChange('openaiModel', v)}
            />
          </FormRow>
          <FormRow label="API Key">
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={store.openaiApiKey}
                onChange={(e) => handleChange('openaiApiKey', e.target.value)}
                className="input-base flex-1 text-xs"
              />
              <button
                type="button"
                onClick={handleSaveKey}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] bg-white/[0.06] hover:bg-white/[0.1] rounded-md transition-colors text-white/68 shrink-0"
              >
                <Key className="w-3 h-3" />
                Save
              </button>
            </div>
          </FormRow>
        </div>
      </section>

      <div className="border-t border-white/[0.06]" />

      {/* Anthropic Configuration */}
      <section className="space-y-2.5">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-white/48" />
          <span className="text-xs font-medium text-white/68 uppercase tracking-wider">Anthropic</span>
        </div>

        <div className="space-y-2">
          <FormRow label="Model">
            <ModelDropdown
              value={store.anthropicModel}
              options={ANTHROPIC_MODELS}
              onChange={(v) => handleChange('anthropicModel', v)}
            />
          </FormRow>
          <FormRow label="API Key">
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={store.anthropicApiKey}
                onChange={(e) => handleChange('anthropicApiKey', e.target.value)}
                className="input-base flex-1 text-xs"
              />
              <button
                type="button"
                onClick={handleSaveKey}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] bg-white/[0.06] hover:bg-white/[0.1] rounded-md transition-colors text-white/68 shrink-0"
              >
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
