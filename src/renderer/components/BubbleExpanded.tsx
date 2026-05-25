import { useAppStore } from '@/renderer/stores/app-store';
import { usePromptStore } from '@/renderer/stores/prompt-store';
import type { AppTab } from '@/shared/types';
import gsap from 'gsap';
import { Clock, Layout, PenLine, Settings, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { HistoryPanel } from './HistoryPanel';
import { InputArea } from './InputArea';
import { OutputPanel } from './OutputPanel';
import { SettingsPanel } from './SettingsPanel';
import { TemplateBrowser } from './TemplateBrowser';

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  const mountedRef = useRef(false);

  // Apply frameless window drag regions (Electron-specific CSS)
  useEffect(() => {
    headerRef.current?.style.setProperty('-webkit-app-region', 'drag');
    closeBtnRef.current?.style.setProperty('-webkit-app-region', 'no-drag');
  }, []);

  // Entrance animation — scale from bubble origin (bottom-right)
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const card = cardRef.current;
    const body = bodyRef.current;
    if (!card) return;

    if (!prefersReduced()) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          card,
          { scale: 0.85, opacity: 0, y: 12, transformOrigin: 'bottom right' },
          { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.4)', willChange: 'transform, opacity' },
        );
        if (body) {
          gsap.fromTo(
            body,
            { opacity: 0 },
            { opacity: 1, duration: 0.25, delay: 0.12, ease: 'power2.out', willChange: 'opacity' },
          );
        }
      });
      return () => ctx.revert();
    }
  }, []);

  // Fade-only transition on tab switch (no jarring slide between different content)
  // biome-ignore lint/correctness/useExhaustiveDependencies: activeTab triggers re-run on tab switch
  useEffect(() => {
    if (prefersReduced()) return;
    const body = bodyRef.current;
    if (!body) return;

    gsap.fromTo(body, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: 'power1.out', willChange: 'opacity' });
  }, [activeTab]);

  return (
    <div
      ref={cardRef}
      className="fixed inset-0 glass-card
                 flex flex-col overflow-hidden z-50"
    >
      {/* Header — draggable for frameless window */}
      <div ref={headerRef} className="relative flex items-center justify-between px-4 py-3 border-b border-border">
        {/* Gradient accent line */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-accent flex items-center justify-center shadow-sm">
            <PenLine className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white/90 tracking-wide">Prompter</span>
          <span className="text-[10px] text-white/48 bg-white/[0.04] px-1.5 py-0.5 rounded-sm">v0.1</span>
        </div>
        <button type="button"
          ref={closeBtnRef}
          onClick={() => setExpanded(false)}
          aria-label="Close"
          className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors group"
        >
          <X className="w-3.5 h-3.5 text-white/48 group-hover:text-white/70" />
        </button>
      </div>

      {/* Tabs with icons */}
      <div className="flex gap-1 px-3 pt-3 pb-1 border-b border-white/[0.04]">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button type="button"
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md capitalize transition-all duration-200 ${
              activeTab === key
                ? 'bg-accent/15 text-white shadow-sm'
                : 'text-white/48 hover:text-white/68 hover:bg-white/[0.04]'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${activeTab === key ? 'text-accent' : ''}`} />
            {label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto px-3 pb-3 pt-2 space-y-2">
        {activeTab === 'compose' && <>{output ? <OutputPanel /> : <InputArea />}</>}
        {activeTab === 'templates' && <TemplateBrowser />}
        {activeTab === 'history' && <HistoryPanel />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>

      {/* Inline processing indicator */}
      {isProcessing && (
        <div className="px-3 py-2 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-accent/40 border-t-accent animate-spin" />
            <span className="text-xs text-white/68">Structuring your prompt...</span>
          </div>
        </div>
      )}
    </div>
  );
}
