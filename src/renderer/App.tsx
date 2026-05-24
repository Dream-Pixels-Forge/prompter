import { Bubble } from '@/renderer/components/Bubble';
import { BubbleExpanded } from '@/renderer/components/BubbleExpanded';
import { Toast } from '@/renderer/components/Toast';
import { useAppStore } from '@/renderer/stores/app-store';
import gsap from 'gsap';
import { useCallback, useEffect, useRef } from 'react';

export default function App() {
  const { isExpanded, setExpanded, setRecording } = useAppStore();
  const recordingRef = useRef(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Keep ref in sync with store
  useEffect(() => {
    recordingRef.current = useAppStore.getState().isRecording;
  });

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
    <div className={`w-screen h-screen overflow-hidden select-none ${isExpanded ? 'bg-[#1C1917]' : ''}`}>
      {/* Backdrop overlay — always mounted so GSAP exit animation can play */}
      <div
        ref={backdropRef}
        onClick={handleBackdropClick}
        className="fixed inset-0 bg-black/30 z-40"
        style={{ opacity: 0, pointerEvents: 'none' }}
      />

      {isExpanded ? <BubbleExpanded /> : <Bubble />}
      <Toast />
    </div>
  );
}
