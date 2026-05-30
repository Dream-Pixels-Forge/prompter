import { useAppStore } from '@/renderer/stores/app-store';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Auto-hides the UI after `delayMs` of inactivity.
 * During processing (`isProcessing`), the UI never auto-hides.
 * Returns `opacity` (1.0 active, 0.3 hidden) and `resetTimer` to restore opacity.
 */
export function useAutoHide(delayMs = 5000): { opacity: number; resetTimer: () => void } {
  const [opacity, setOpacity] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { isProcessing } = useAppStore();

  const resetTimer = useCallback(() => {
    setOpacity(1);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isProcessing) {
      timerRef.current = setTimeout(() => setOpacity(0.3), delayMs);
    }
  }, [delayMs, isProcessing]);

  // Start/reset timer on mount or when deps change
  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  // Keep opacity at 1 while processing, restart timer when processing ends
  useEffect(() => {
    if (isProcessing) {
      setOpacity(1);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      resetTimer();
    }
  }, [isProcessing, resetTimer]);

  return { opacity, resetTimer };
}
