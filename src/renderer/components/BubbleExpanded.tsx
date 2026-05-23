import { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import gsap from 'gsap';
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
  const cardRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Entrance animation
  useEffect(() => {
    const card = cardRef.current;
    const body = bodyRef.current;
    if (!card) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(card,
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.4)' }
      );
      if (body) {
        gsap.fromTo(body,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.25, delay: 0.15, ease: 'power2.out' }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  // Slide content on tab switch
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    gsap.fromTo(body,
      { opacity: 0, x: -8 },
      { opacity: 1, x: 0, duration: 0.2, ease: 'power1.out' }
    );
  }, [activeTab]);

  return (
    <div ref={cardRef}
      className="fixed bottom-4 right-4 w-[360px] max-h-[520px] glass-card
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
      <div ref={bodyRef} className="flex-1 overflow-y-auto px-4 pb-4 pt-2 space-y-3">
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
