import { Bubble } from '@/renderer/components/Bubble';
import { BubbleExpanded } from '@/renderer/components/BubbleExpanded';
import { Toast } from '@/renderer/components/Toast';
import { useAppStore } from '@/renderer/stores/app-store';
import gsap from 'gsap';
import { useCallback, useEffect, useRef } from 'react';

export default function App() {
  const { isExpanded, setExpanded } = useAppStore();
  const backdropRef = useRef<HTMLDivElement>(null);

  // Listen for global hotkeys from main process
  useEffect(() => {
    const cleanup = window.api.hotkey.onTriggered((action: string) => {
      if (action === 'toggle-mic') {
        const current = useAppStore.getState().isRecording;
        useAppStore.getState().setRecording(!current);
      }
    });
    return cleanup;
  }, []);

  // Resize Electron window to match content (bubble vs expanded card)
  useEffect(() => {
    if (isExpanded) {
      // Save bubble window position before expanding so we can restore it on collapse
      window.api.window.getPosition().then((pos) => {
        window.api.bubble.setWindowPosition(pos);
      });
      window.api.window.resize(520, 520);
    } else {
      window.api.window.resize(80, 80);
      // Restore bubble window position so it goes back where the user placed it
      window.api.bubble.getWindowPosition().then((pos) => {
        if (pos) {
          window.api.window.setBounds(pos);
        }
      });
    }
  }, [isExpanded]);

  // Escape key to close expanded card
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, setExpanded]);

  // Backdrop entrance/exit animation (always-mounted div so exit plays before unmount)
  useEffect(() => {
    const el = backdropRef.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      if (isExpanded) {
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
      } else {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      }
      return;
    }

    const ctx = gsap.context(() => {
      if (isExpanded) {
        gsap.set(el, { pointerEvents: 'auto' });
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
      } else {
        gsap.to(el, {
          opacity: 0,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => {
            gsap.set(el, { pointerEvents: 'none' });
          },
        });
      }
    });

    return () => ctx.revert();
  }, [isExpanded]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        setExpanded(false);
      }
    },
    [setExpanded],
  );

  return (
    <div className={`w-screen h-screen overflow-hidden select-none ${isExpanded ? 'bg-surface' : ''}`}>
      {/* Backdrop overlay — always mounted so GSAP exit animation can play */}
      <div
        ref={backdropRef}
        onClick={handleBackdropClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setExpanded(false);
        }}
        className="fixed inset-0 bg-black/30 z-40"
        style={{ opacity: 0, pointerEvents: 'none' }}
      />

      {isExpanded ? <BubbleExpanded /> : <Bubble />}
      <Toast />
    </div>
  );
}
