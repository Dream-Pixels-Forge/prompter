import { PROVIDER_DEFINITIONS } from '@/shared/provider-definitions';
import { Server } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../stores/app-store';
import { useSettingsStore } from '../stores/settings-store';
import { ProviderConfigCard } from './ProviderConfigCard';
import { ProviderSwitcher } from './ProviderSwitcher';

export function ProviderSettings() {
  const store = useSettingsStore();
  const showToast = useAppStore((s) => s.showToast);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const activeDef = PROVIDER_DEFINITIONS.find((p) => p.id === store.activeProvider);
  const configuredProviders = new Set(Object.keys(store.hasApiKeys).filter((k) => store.hasApiKeys[k]));

  const handleSelect = (providerId: string) => {
    if (providerId !== store.activeProvider) {
      store.updateSetting('activeProvider', providerId);
      store.saveSettings().then(() => showToast('Switched provider'));
    }
  };

  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <Server className="w-3.5 h-3.5 text-white/48" />
        <span className="text-xs font-medium text-white/68 uppercase tracking-wider">Provider</span>
      </div>

      {/* Inline switcher */}
      <div ref={switcherRef} className="relative mb-2">
        <button
          type="button"
          onClick={() => setSwitcherOpen(!switcherOpen)}
          className="w-full flex items-center gap-2.5 px-3 py-2 sub-card hover:border-white/[0.1] transition-all text-left"
        >
          <div className="w-4 h-4 rounded-full border-2 border-accent flex items-center justify-center shrink-0">
            <div className="w-2 h-2 rounded-full bg-accent" />
          </div>
          <span className="text-sm text-white/80 font-medium flex-1">{activeDef?.name ?? store.activeProvider}</span>
          <span className="text-[11px] text-white/48">{activeDef?.description}</span>
          <Server className={`w-3.5 h-3.5 text-white/48 transition-transform ${switcherOpen ? 'rotate-180' : ''}`} />
        </button>

        <ProviderSwitcher
          open={switcherOpen}
          onClose={() => setSwitcherOpen(false)}
          onSelect={handleSelect}
          activeProvider={store.activeProvider}
          configuredProviders={configuredProviders}
          providerConfigs={store.providerConfigs}
        />
      </div>

      <div className="space-y-1.5">
        {/* Active provider config — expanded */}
        {store.activeProvider && (
          <ProviderConfigCard
            key={store.activeProvider}
            providerId={store.activeProvider}
            isActive={true}
            onSetActive={() => {}}
          />
        )}

        {/* Other providers — collapsed */}
        {PROVIDER_DEFINITIONS.filter((p) => p.id !== store.activeProvider).map((def) => (
          <ProviderConfigCard
            key={def.id}
            providerId={def.id}
            isActive={false}
            onSetActive={() => handleSelect(def.id)}
          />
        ))}
      </div>
    </section>
  );
}
