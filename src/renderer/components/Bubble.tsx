import { useBubblePosition } from '@/renderer/hooks/useBubblePosition';
import { useAppStore } from '@/renderer/stores/app-store';
import gsap from 'gsap';
import { Info, LogOut, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Bubble() {
  const { toggleExpanded } = useAppStore();
  const { position, isDragging, startDrag } = useBubblePosition();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [adjustedPos, setAdjustedPos] = useState<{ left?: number; top?: number; right?: number; bottom?: number } | null>(null);

  // Floating/pulse animation on inner button only
  useEffect(() => {
    if (prefersReduced()) return;
    const el = bubbleRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.to(el, {
        y: -4,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        willChange: 'transform',
      });
    });

    return () => ctx.revert();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!menuPos) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setMenuPos(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuPos]);

  // Adjust menu position to avoid viewport clipping
  useLayoutEffect(() => {
    if (!menuPos || !menuRef.current) {
      setAdjustedPos(null);
      return;
    }
    const rect = menuRef.current.getBoundingClientRect();
    const { innerWidth, innerHeight } = window;
    const style: { left?: number; top?: number; right?: number; bottom?: number } = {};
    if (menuPos.x + rect.width > innerWidth - 8) {
      style.right = innerWidth - menuPos.x;
    } else {
      style.left = menuPos.x;
    }
    if (menuPos.y + rect.height > innerHeight - 8) {
      style.bottom = innerHeight - menuPos.y;
    } else {
      style.top = menuPos.y;
    }
    setAdjustedPos(style);
  }, [menuPos]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setAdjustedPos(null);
    setMenuPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleAbout = useCallback(() => {
    setMenuPos(null);
    toggleExpanded();
  }, [toggleExpanded]);

  const handleQuit = useCallback(async () => {
    setMenuPos(null);
    await window.api.app.quit();
  }, []);

  return (
    <div
      ref={wrapperRef}
      onMouseDown={(e) => startDrag(e)}
      onTouchStart={(e) => startDrag(e)}
      onContextMenu={handleContextMenu}
      className="fixed z-50"
      style={{ bottom: `${position.bottom}px`, right: `${position.right}px` }}
    >
      <button
        ref={bubbleRef}
        type="button"
        onClick={toggleExpanded}
        aria-label="Open Prompter"
        className={`w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-accent
                   flex items-center justify-center cursor-pointer shadow-lg shadow-brand-500/25
                   hover:shadow-xl hover:shadow-brand-500/35 ${isDragging ? '' : 'hover:scale-110'}
                   transition-all duration-300 ease-out
                   backdrop-blur-sm border border-white/[0.12]`}
      >
        {/* Inner glow */}
        <div className="absolute inset-1 rounded-full bg-white/[0.06]" />
        <Sparkles className="w-5 h-5 text-white relative z-10" />
      </button>

      {/* Context menu */}
      {menuPos && adjustedPos && (
        <div
          ref={menuRef}
          className="fixed z-[100] min-w-[140px] py-1 rounded-xl bg-[#1a1f2e] border border-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-xl"
          style={adjustedPos}
        >
          <button type="button"
            onClick={handleAbout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white/72 hover:text-white hover:bg-white/[0.06] transition-colors text-left"
          >
            <Info className="w-3.5 h-3.5" />
            About
          </button>
          <div className="h-px bg-white/[0.06] mx-2" />
          <button type="button"
            onClick={handleQuit}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400/80 hover:text-red-400 hover:bg-white/[0.06] transition-colors text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            Quit
          </button>
        </div>
      )}
    </div>
  );
}
