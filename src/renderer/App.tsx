import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { useAppStore } from '@/renderer/stores/app-store';
import { Bubble } from '@/renderer/components/Bubble';
import { BubbleExpanded } from '@/renderer/components/BubbleExpanded';
import { Toast } from '@/renderer/components/Toast';

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

  // Backdrop entrance/exit animation
  useEffect(() => {
    const el = backdropRef.current;
    if (!el) return;

    if (isExpanded) {
      gsap.fromTo(el,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power2.out' }
      );
    }
  }, [isExpanded]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setExpanded(false);
    }
  }, [setExpanded]);

  return (
    <div className={`w-screen h-screen overflow-hidden select-none ${isExpanded ? 'bg-[#1C1917]' : ''}`}>
      {/* Backdrop overlay */}
      {isExpanded && (
        <div ref={backdropRef}
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/30 z-40"
        />
      )}

      {isExpanded ? <BubbleExpanded /> : <Bubble />}
      <Toast />
    </div>
  );
}
