import { BubbleExpanded } from '@/renderer/components/BubbleExpanded';
import { ErrorBoundary } from '@/renderer/components/ErrorBoundary';
import { Toast } from '@/renderer/components/Toast';
import { useAppStore } from '@/renderer/stores/app-store';
import { useEffect } from 'react';

export default function App() {
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

  // Escape key to hide window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.api.window.toggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ErrorBoundary>
      <div className="w-screen h-screen overflow-hidden select-none">
        <BubbleExpanded />
        <Toast />
      </div>
    </ErrorBoundary>
  );
}
