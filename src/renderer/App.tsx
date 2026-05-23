import { useEffect, useRef } from 'react';
import { useAppStore } from '@/renderer/stores/app-store';
import { Bubble } from '@/renderer/components/Bubble';
import { BubbleExpanded } from '@/renderer/components/BubbleExpanded';
import { Toast } from '@/renderer/components/Toast';

export default function App() {
  const { isExpanded, setExpanded, setRecording } = useAppStore();
  const recordingRef = useRef(false);

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

  return (
    <div className="w-screen h-screen overflow-hidden select-none">
      {isExpanded ? <BubbleExpanded /> : <Bubble />}
      <Toast />
    </div>
  );
}
