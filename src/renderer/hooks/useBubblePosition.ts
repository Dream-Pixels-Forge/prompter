import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'prompter-bubble-pos';
const DEFAULT_POSITION = { bottom: 104, right: 44 };

interface Position {
  bottom: number;
  right: number;
}

export function migratePosition(saved: Record<string, unknown>): Position {
  if ('bottom' in saved && 'right' in saved) {
    return { bottom: Number(saved.bottom), right: Number(saved.right) };
  }
  if ('x' in saved && 'y' in saved) {
    return {
      bottom: 24 - Number(saved.y),
      right: 24 - Number(saved.x),
    };
  }
  return DEFAULT_POSITION;
}

function getClientCoords(e: MouseEvent | TouchEvent): { x: number; y: number } {
  if ('touches' in e) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
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

  // On mount, load the durable position from main process storage
  useEffect(() => {
    window.api.bubble.getPosition().then((saved: Position | null) => {
      if (saved && (saved.bottom !== positionRef.current.bottom || saved.right !== positionRef.current.right)) {
        setPosition(saved);
      }
    });
  }, []);

  const startDrag = useCallback((e: React.MouseEvent | React.TouchEvent, currentPos: Position) => {
    e.preventDefault();
    const coords =
      'touches' in e ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    setDragStart(coords);
    setDragOrigin(currentPos);
  }, []);

  const onDrag = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const coords = getClientCoords(e);
      const newPos = {
        bottom: dragOrigin.bottom + (dragStart.y - coords.y),
        right: dragOrigin.right + (dragStart.x - coords.x),
      };
      setPosition(newPos);
    },
    [isDragging, dragStart, dragOrigin],
  );

  const stopDrag = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      const pos = positionRef.current;
      // Immediate localStorage cache
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
      // Durable persistence via main process IPC
      window.api.bubble.setPosition(pos);
    }
  }, [isDragging]);

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
