import { useCallback, useEffect, useRef, useState } from 'react';

// The bubble's CSS position within the 80x80 window is fixed (bottom-right corner).
// The actual screen position of the bubble is controlled by moving the Electron window.
const BUBBLE_CSS_POS = { bottom: 12, right: 12 };

export function useBubblePosition() {
  const [position] = useState(BUBBLE_CSS_POS);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ screenX: number; screenY: number; winX: number; winY: number } | null>(null);

  const startDrag = useCallback(async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const screenX = 'touches' in e ? e.touches[0].screenX : e.screenX;
    const screenY = 'touches' in e ? e.touches[0].screenY : e.screenY;

    try {
      const winPos = await window.api.window.getPosition();
      dragRef.current = { screenX, screenY, winX: winPos.x, winY: winPos.y };
      setIsDragging(true);
    } catch {
      dragRef.current = null;
    }
  }, []);

  const onDrag = useCallback((e: MouseEvent | TouchEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    const screenX = 'touches' in e ? e.touches[0].screenX : e.screenX;
    const screenY = 'touches' in e ? e.touches[0].screenY : e.screenY;

    const dx = screenX - drag.screenX;
    const dy = screenY - drag.screenY;

    window.api.window.setBounds({
      x: Math.round(drag.winX + dx),
      y: Math.round(drag.winY + dy),
    });
  }, []);

  const stopDrag = useCallback(() => {
    if (dragRef.current) {
      setIsDragging(false);
      window.api.window.getPosition().then((pos) => {
        window.api.bubble.setWindowPosition(pos);
      });
      dragRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onDrag);
      window.addEventListener('mouseup', stopDrag);
      window.addEventListener('touchmove', onDrag, { passive: false });
      window.addEventListener('touchend', stopDrag);
      return () => {
        window.removeEventListener('mousemove', onDrag);
        window.removeEventListener('mouseup', stopDrag);
        window.removeEventListener('touchmove', onDrag);
        window.removeEventListener('touchend', stopDrag);
      };
    }
  }, [isDragging, onDrag, stopDrag]);

  return { position, isDragging, startDrag };
}
