import { useRef, useEffect } from 'react';
import { X, PenLine, Layout, Clock, Settings } from 'lucide-react';
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

const tabs: { key: AppTab; label: string; icon: typeof PenLine }[] = [
  { key: 'compose', label: 'Compose', icon: PenLine },
  { key: 'templates', label: 'Templates', icon: Layout },
  { key: 'history', label: 'History', icon: Clock },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export function BubbleExpanded() {
  const { setExpanded, isProcessing, activeTab, setActiveTab } = useAppStore();
  const { output } = usePromptStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Apply frameless window drag regions (Electron-specific CSS)
  useEffect(() => {
    headerRef.current?.style.setProperty('-webkit-app-region', 'drag');
    closeBtnRef.current?.style.setProperty('-webkit-app-region', 'no-drag');
  }, []);

  // Entrance animation — scale from bubble origin (bottom-right)
  useEffect(() => {
    const card = cardRef.current;
    const body = bodyRef.current;
    if (!card) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(card,
        { scale: 0.85, opacity: 0, y: 12, transformOrigin: 'bottom right' },
        { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.4)' }
      );
      if (body) {
        gsap.fromTo(body,
          { opacity: 0 },
          { opacity: 1, duration: 0.25, delay: 0.12, ease: 'power2.out' }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  // Fade-only transition on tab switch (no jarring slide between different content)
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;

    gsap.fromTo(body,
      { opacity: 0 },
      { opacity: 1, duration: 0.15, ease: 'power1.out' }
    );
  }, [activeTab]);

  return (
    <div ref={cardRef}
      className="fixed bottom-4 right-4 w-[420px] max-h-[580px] glass-card
                 flex flex-col overflow-hidden z-50">

      {/* Header — draggable for frameless window */}
      <div ref={headerRef} className="relative flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
        {/* Gradient accent line */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#4A7FA0]/40 to-transparent" />
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#2D4A7A] to-[#4A7FA0] flex items-center justify-center shadow-sm">
            <PenLine className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white/90 tracking-wide">Prompter</span>
          <span className="text-[10px] text-white/25 bg-white/[0.04] px-1.5 py-0.5 rounded-md">v0.1</span>
        </div>
        <button ref={closeBtnRef} onClick={() => setExpanded(false)}
          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors group">
          <X className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70" />
        </button>
      </div>

      {/* Tabs with icons */}
      <div className="flex gap-1 px-4 pt-3.5 pb-1.5 border-b border-white/[0.04]">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg capitalize transition-all duration-200 ${
              activeTab === key
                ? 'bg-[#4A7FA0]/15 text-white shadow-sm'
                : 'text-white/35 hover:text-white/60 hover:bg-white/[0.04]'
            }`}>
            <Icon className={`w-3.5 h-3.5 ${activeTab === key ? 'text-[#4A7FA0]' : ''}`} />
            {label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto px-4 pb-4 pt-3 space-y-3">
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
