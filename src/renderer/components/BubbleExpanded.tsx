import { X } from 'lucide-react';
import { useAppStore } from '@/renderer/stores/app-store';
import { usePromptStore } from '@/renderer/stores/prompt-store';
import { type AppTab } from '@/shared/types';
import { InputArea } from './InputArea';
import { OutputPanel } from './OutputPanel';
import { ProcessingOverlay } from './ProcessingOverlay';
import { TemplateBrowser } from './TemplateBrowser';
import { HistoryPanel } from './HistoryPanel';
import { SettingsPanel } from './SettingsPanel';

const tabs: { key: AppTab; label: string }[] = [
  { key: 'compose', label: 'Compose' },
  { key: 'templates', label: 'Templates' },
  { key: 'history', label: 'History' },
  { key: 'settings', label: 'Settings' },
];

export function BubbleExpanded() {
  const { setExpanded, isProcessing, activeTab, setActiveTab } = useAppStore();
  const { output } = usePromptStore();

  return (
    <div className="fixed bottom-4 right-4 w-[360px] max-h-[520px]
                    bg-[#1C1917]/90 backdrop-blur-2xl
                    border border-white/[0.06] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                    flex flex-col overflow-hidden z-50">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <span className="text-sm font-semibold text-white/90 tracking-wide">Prompter</span>
        <button onClick={() => setExpanded(false)}
          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
          <X className="w-3.5 h-3.5 text-white/60" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-3 pt-3 pb-1">
        {tabs.map(({ key, label }) => (
          <button key={key}
            onClick={() => setActiveTab(key)}
            className={`px-3 py-1.5 text-xs rounded-lg capitalize transition-colors ${
              activeTab === key
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/60'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 space-y-3">
        {activeTab === 'compose' && (
          <>{output ? <OutputPanel /> : <InputArea />}</>
        )}
        {activeTab === 'templates' && <TemplateBrowser />}
        {activeTab === 'history' && <HistoryPanel />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>

      {isProcessing && <ProcessingOverlay />}
    </div>
  );
}
