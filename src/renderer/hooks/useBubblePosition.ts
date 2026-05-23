import { useState, useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY = 'prompter-bubble-pos';
const DEFAULT_POSITION = { bottom: 104, right: 44 };

interface Position {
  bottom: number;
  right: number;
}

/**
 * Migrate from old {x, y} translate-offset format (relative to CSS bottom:24; right:24 anchor)
 * to new absolute viewport-coordinate {bottom, right} format.
 *
 * Old {x: -20, y: -80} with CSS bottom:24px; right:24px anchor had an
 * effective visual position of bottom:104px; right:44px.
 * Conversion: bottom = 24 - y, right = 24 - x
 */
function migratePosition(saved: Record<string, unknown>): Position {
  if ('bottom' in saved && 'right' in saved) {
    return { bottom: Number(saved.bottom), right: Number(saved.right) };
  }
  // Legacy format: {x, y} as translate offsets
  if ('x' in saved && 'y' in saved) {
    return {
      bottom: 24 - Number(saved.y),
      right: 24 - Number(saved.x),
    };
  }
  return DEFAULT_POSITION;
}

export function useBubblePosition() {
  const [position, setPosition] = useState<Position>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return DEFAULT_POSITION;
      const parsed = JSON.parse(saved);
      return migratePosition(parsed);
    } catch {
      return DEFAULT_POSITION;
    }
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOrigin, setDragOrigin] = useState<Position>({ bottom: 0, right: 0 });
  const positionRef = useRef(position);
  positionRef.current = position;

  const startDrag = useCallback((e: React.MouseEvent, currentPos: Position) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOrigin(currentPos);
  }, []);

  const onDrag = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newPos = {
      bottom: dragOrigin.bottom + (dragStart.y - e.clientY),
      right: dragOrigin.right + (dragStart.x - e.clientX),
    };
    setPosition(newPos);
  }, [isDragging, dragStart, dragOrigin]);

  const stopDrag = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positionRef.current));
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onDrag);
      window.addEventListener('mouseup', stopDrag);
      return () => {
        window.removeEventListener('mousemove', onDrag);
        window.removeEventListener('mouseup', stopDrag);
      };
    }
  }, [isDragging, onDrag, stopDrag]);

  return { position, isDragging, startDrag };
}
