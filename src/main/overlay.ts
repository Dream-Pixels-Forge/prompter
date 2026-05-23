import { BrowserWindow, screen } from 'electron';

export function setWindowPosition(win: BrowserWindow, x: number, y: number) {
  const bounds = win.getBounds();
  const display = screen.getDisplayNearestPoint({ x, y });
  const { width: dWidth, height: dHeight } = display.workAreaSize;

  // Clamp to visible area
  const clampedX = Math.max(0, Math.min(x, dWidth - bounds.width));
  const clampedY = Math.max(0, Math.min(y, dHeight - bounds.height));

  win.setBounds({ x: clampedX, y: clampedY });
}

export function getDefaultPosition(win: BrowserWindow): { x: number; y: number } {
  const display = screen.getPrimaryDisplay();
  const { width: dWidth, height: dHeight } = display.workAreaSize;
  const bounds = win.getBounds();

  return {
    x: dWidth - bounds.width - 20,
    y: Math.floor(dHeight / 2) - Math.floor(bounds.height / 2),
  };
}
