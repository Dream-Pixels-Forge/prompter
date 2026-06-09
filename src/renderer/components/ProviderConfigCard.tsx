import { PROVIDER_DEFINITIONS, getProviderDefinition } from '@/shared/provider-definitions';
import { ChevronDown, ExternalLink, Key } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../stores/app-store';
import { useSettingsStore } from '../stores/settings-store';

interface ProviderConfigCardProps {
  providerId: string;
  isActive: boolean;
  onSetActive: () => void;
}

export function ProviderConfigCard({ providerId, isActive, onSetActive }: ProviderConfigCardProps) {
  const store = useSettingsStore();
  const showToast = useAppStore((s) => s.showToast);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [checking, setChecking] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up debounced timer on unmount to prevent fires on unmounted component
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const def = getProviderDefinition(providerId);
  if (!def) return null;

  const config = store.providerConfigs[providerId] ?? { model: def.defaultModel, endpoint: def.defaultEndpoint };
  const hasKey = !!store.hasApiKeys[providerId];

  // Use fetched Ollama models if available, otherwise fall back to definition
  const availableModels = providerId === 'ollama' && store.ollamaModels.length > 0 ? store.ollamaModels : def.models;

  // Collapsed state
  if (!isActive) {
    return (
      <button
        type="button"
        onClick={onSetActive}
        aria-label={`Select ${def.name} as active provider${hasKey ? ' (configured)' : ''}`}
        className="w-full flex items-center gap-2.5 px-3 py-2 sub-card hover:border-white/[0.1] transition-all text-left"
      >
        <div className="w-3.5 h-3.5 rounded-full border-2 border-white/15 flex items-center justify-center shrink-0" />
        <span className="text-xs text-white/68 flex-1">{def.name}</span>
        {hasKey && (
          <span className="text-[10px] text-green-400 flex items-center gap-1">
            <span>✓</span> Configured
          </span>
        )}
        <ChevronDown className="w-3 h-3 text-white/48 -rotate-90" />
      </button>
    );
  }

  // Expanded state (active provider)
  const debouncedSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await store.saveSettings();
        showToast('Saved');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Save failed');
      }
    }, 800);
  };

  const handleModelChange = (model: string) => {
    const configs = { ...store.providerConfigs };
    configs[providerId] = { ...configs[providerId], model };
    store.updateSetting('providerConfigs', configs);
    debouncedSave();
  };

  const handleEndpointChange = (endpoint: string) => {
    const configs = { ...store.providerConfigs };
    configs[providerId] = { ...configs[providerId], endpoint };
    store.updateSetting('providerConfigs', configs);
    debouncedSave();
  };

  const handleSaveKey = async () => {
    try {
      await store.saveProviderKey(providerId, apiKeyInput);
      setApiKeyInput(''); // Clear plaintext from renderer memory
      showToast('API key saved');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save API key');
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    try {
      const result = await window.api.provider.check(providerId);
      showToast(result.available ? 'Connected ✓' : `Failed: ${result.message ?? 'unknown error'}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="sub-card space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/80">{def.name}</span>
        <span className="text-[9px] text-accent/60 uppercase tracking-wider">Active</span>
      </div>

      {/* Model dropdown */}
      <div className="grid grid-cols-[70px_1fr] items-center gap-2">
        <span className="text-[11px] text-white/48 font-medium">Model</span>
        {availableModels.length > 0 ? (
          <div className="relative">
            <select
              value={config.model}
              onChange={(e) => handleModelChange(e.target.value)}
              aria-label={`${def.name} model selection`}
              className="input-base w-full appearance-none cursor-pointer pr-7 text-xs"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/48" />
          </div>
        ) : (
          <input
            type="text"
            value={config.model}
            onChange={(e) => handleModelChange(e.target.value)}
            aria-label={`${def.name} model name`}
            className="input-base w-full text-xs"
            placeholder={def.defaultModel}
          />
        )}
      </div>

      {/* API Key */}
      {def.needsApiKey && (
        <div className="grid grid-cols-[70px_1fr] items-center gap-2">
          <span className="text-[11px] text-white/48 font-medium">API Key</span>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              aria-label={`${def.name} API key`}
              className="input-base flex-1 text-xs"
              placeholder={hasKey ? '••••••••' : 'Enter API key...'}
            />
            <button
              type="button"
              onClick={handleSaveKey}
              aria-label="Save API key"
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] bg-white/[0.06] hover:bg-white/[0.1] rounded-md transition-colors text-white/68 shrink-0"
            >
              <Key className="w-3 h-3" />
              Save
            </button>
          </div>
        </div>
      )}

      {/* Endpoint (only if needsEndpoint) */}
      {def.needsEndpoint && (
        <div className="grid grid-cols-[70px_1fr] items-center gap-2">
          <span className="text-[11px] text-white/48 font-medium">Endpoint</span>
          <input
            type="text"
            value={config.endpoint ?? def.defaultEndpoint ?? ''}
            onChange={(e) => handleEndpointChange(e.target.value)}
            aria-label={`${def.name} API endpoint`}
            className="input-base w-full text-xs"
          />
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleCheck}
          disabled={checking}
          aria-label={`Check ${def.name} connection`}
          className="btn-subtle text-[10px]"
        >
          {checking ? 'Checking...' : 'Check'}
        </button>
        <a
          href={def.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-white/48 hover:text-white/80 transition-colors"
        >
          <ExternalLink className="w-2.5 h-2.5" />
          {new URL(def.website).hostname}
        </a>
      </div>
    </div>
  );
}
