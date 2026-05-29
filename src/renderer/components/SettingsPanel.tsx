import type { AppSettings } from '@/shared/types';
import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/app-store';
import { useSettingsStore } from '../stores/settings-store';
import { ProviderSettings } from './ProviderSettings';

export function SettingsPanel() {
  const store = useSettingsStore();
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const checkOllamaStatus = useSettingsStore((s) => s.checkOllamaStatus);
  const showToast = useAppStore((s) => s.showToast);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadSettings();
    checkOllamaStatus();
  }, [loadSettings, checkOllamaStatus]);

  // Clear debounce timer on unmount to prevent fires on unmounted component
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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

      <div className="border-t border-white/[0.06]" />

      {/* General settings */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-white/68 uppercase tracking-wider">General</span>
        </div>

        {/* Launch on startup */}
        <label className="flex items-center justify-between py-2">
          <span className="text-xs text-white/68">Launch on startup</span>
          <input
            type="checkbox"
            checked={store.launchOnStartup}
            onChange={(e) => handleChange('launchOnStartup', e.target.checked)}
            className="toggle"
          />
        </label>

        {/* Auto-hide delay */}
        <div className="flex items-center justify-between py-2">
          <span className="text-xs text-white/68">Auto-hide delay ({store.autoHideDelay}s)</span>
          <input
            type="range"
            min={1}
            max={30}
            value={store.autoHideDelay}
            onChange={(e) => handleChange('autoHideDelay', Number(e.target.value))}
            className="w-24"
          />
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between py-2">
          <span className="text-xs text-white/68">Theme</span>
          <select
            value={store.theme}
            onChange={(e) => handleChange('theme', e.target.value as 'dark' | 'light' | 'system')}
            className="input-base text-xs w-28"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </div>
      </section>
    </div>
  );
}
