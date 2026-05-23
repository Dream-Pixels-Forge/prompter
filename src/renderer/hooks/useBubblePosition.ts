import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'prompter-bubble-pos';
const DEFAULT_POSITION = { x: -20, y: -80 };

interface Position {
  x: number;
  y: number;
}

export function useBubblePosition() {
  const [position, setPosition] = useState<Position>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_POSITION;
    } catch {
      return DEFAULT_POSITION;
    }
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [dragOrigin, setDragOrigin] = useState<Position>({ x: 0, y: 0 });

  const startDrag = useCallback((e: React.MouseEvent, currentPos: Position) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOrigin(currentPos);
  }, []);

  const onDrag = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const newPos = {
      x: dragOrigin.x + dx,
      y: dragOrigin.y + dy,
    };
    setPosition(newPos);
  }, [isDragging, dragStart, dragOrigin]);

  const stopDrag = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    }
  }, [isDragging, position]);

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
