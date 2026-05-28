import type { AppSettings } from '@/shared/types';
import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/app-store';
import { useSettingsStore } from '../stores/settings-store';
import { ProviderSettings } from './ProviderSettings';

export function SettingsPanel() {
  const store = useSettingsStore();
  const showToast = useAppStore((s) => s.showToast);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <div className="space-y-3">
      <ProviderSettings />

      <div className="border-t border-white/[0.06]" />

      {/* Hotkey settings */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-white/68 uppercase tracking-wider">Hotkeys</span>
        </div>
        <div className="grid grid-cols-[70px_1fr] items-center gap-2">
          <span className="text-[11px] text-white/48 font-medium">Toggle</span>
          <input
            type="text"
            value={store.hotkeyToggle}
            onChange={(e) => handleChange('hotkeyToggle', e.target.value)}
            className="input-base w-full text-xs"
          />
        </div>
        <div className="grid grid-cols-[70px_1fr] items-center gap-2">
          <span className="text-[11px] text-white/48 font-medium">Mic</span>
          <input
            type="text"
            value={store.hotkeyMic}
            onChange={(e) => handleChange('hotkeyMic', e.target.value)}
            className="input-base w-full text-xs"
          />
        </div>
      </section>
    </div>
  );
}
