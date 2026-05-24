import type { BrowserWindow } from 'electron';
import { screen } from 'electron';

export function setWindowPosition(win: BrowserWindow, x: number, y: number) {
  const bounds = win.getBounds();
  const display = screen.getDisplayNearestPoint({ x, y });
  const { width: dWidth, height: dHeight } = display.workAreaSize;

  // Clamp to visible area
  const clampedX = Math.max(0, Math.min(x, dWidth - bounds.width));
  const clampedY = Math.max(0, Math.min(y, dHeight - bounds.height));

  win.setBounds({ x: clampedX, y: clampedY });
}
