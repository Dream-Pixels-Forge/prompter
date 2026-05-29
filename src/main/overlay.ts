import type { BrowserWindow } from 'electron';
import { screen } from 'electron';

const SNAP_THRESHOLD = 20;

export function setWindowPosition(win: BrowserWindow, x: number, y: number) {
  const bounds = win.getBounds();
  const display = screen.getDisplayNearestPoint({ x, y });
  const workArea = display.workArea;
  const areaX = workArea.x;
  const areaY = workArea.y;
  const areaWidth = workArea.width;
  const areaHeight = workArea.height;

  // Snap to edges when within threshold (relative to display work area origin)
  let snappedX = x;
  let snappedY = y;

  // Horizontal snapping
  if (Math.abs(x - areaX) < SNAP_THRESHOLD) {
    snappedX = areaX;
  } else if (Math.abs(x + bounds.width - (areaX + areaWidth)) < SNAP_THRESHOLD) {
    snappedX = areaX + areaWidth - bounds.width;
  }

  // Vertical snapping
  if (Math.abs(y - areaY) < SNAP_THRESHOLD) {
    snappedY = areaY;
  } else if (Math.abs(y + bounds.height - (areaY + areaHeight)) < SNAP_THRESHOLD) {
    snappedY = areaY + areaHeight - bounds.height;
  }

  // Clamp to visible area
  const clampedX = Math.max(areaX, Math.min(snappedX, areaX + areaWidth - bounds.width));
  const clampedY = Math.max(areaY, Math.min(snappedY, areaY + areaHeight - bounds.height));

  win.setBounds({ x: clampedX, y: clampedY });
}
