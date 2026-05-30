import type { BrowserWindow, Display } from 'electron';
import { describe, expect, it, vi } from 'vitest';

// Mock electron's screen module
vi.mock('electron', () => {
  const mockDisplay: Display = {
    id: 1,
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    workArea: { x: 0, y: 0, width: 1920, height: 1080 },
    workAreaSize: { width: 1920, height: 1080 },
    size: { width: 1920, height: 1080 },
    scaleFactor: 1,
    rotation: 0,
    touchSupport: 'unknown',
    accelerometerSupport: 'unknown',
    colorDepth: 24,
    colorSpace: 'srgb',
    depthPerComponent: 8,
    detected: true,
    displayFrequency: 60,
    internal: false,
    label: 'mock display',
    maximumCursorSize: { width: 64, height: 64 },
    monochrome: false,
    nativeOrigin: { x: 0, y: 0 },
  };

  return {
    screen: {
      getDisplayNearestPoint: vi.fn(() => mockDisplay),
    },
  };
});

import { setWindowPosition } from '@/main/overlay';

function createMockWindow(overrides: Partial<Electron.Rectangle> = {}): BrowserWindow {
  const bounds = { x: 0, y: 0, width: 400, height: 300, ...overrides };
  return {
    getBounds: () => bounds,
    setBounds: vi.fn(),
  } as unknown as BrowserWindow;
}

describe('setWindowPosition', () => {
  it('snaps to x=0 when within threshold of left edge', () => {
    const win = createMockWindow({ width: 400, height: 300 });

    // x=5 is within the 20px snap threshold from the left edge (0)
    setWindowPosition(win, 5, 50);

    expect(win.setBounds).toHaveBeenCalledWith({ x: 0, y: 50 });
  });

  it('snaps to right edge when within threshold', () => {
    const win = createMockWindow({ width: 400, height: 300 });

    // dWidth=1920, bounds.width=400, so right edge at 1920-400=1520
    // x=1510 is within 20px of 1520 => snap to 1520
    setWindowPosition(win, 1510, 50);

    expect(win.setBounds).toHaveBeenCalledWith({ x: 1520, y: 50 });
  });

  it('snaps to y=0 when within threshold of top edge', () => {
    const win = createMockWindow({ width: 400, height: 300 });

    // y=10 is within the 20px snap threshold from the top edge (0)
    setWindowPosition(win, 100, 10);

    expect(win.setBounds).toHaveBeenCalledWith({ x: 100, y: 0 });
  });

  it('snaps to bottom edge when within threshold', () => {
    const win = createMockWindow({ width: 400, height: 300 });

    // dHeight=1080, bounds.height=300, so bottom edge at 1080-300=780
    // y=770 is within 20px of 780 => snap to 780
    setWindowPosition(win, 100, 770);

    expect(win.setBounds).toHaveBeenCalledWith({ x: 100, y: 780 });
  });

  it('snaps both x and y simultaneously', () => {
    const win = createMockWindow({ width: 400, height: 300 });

    // x=3 near left edge, y=5 near top edge
    setWindowPosition(win, 3, 5);

    expect(win.setBounds).toHaveBeenCalledWith({ x: 0, y: 0 });
  });

  it('does not snap when outside threshold', () => {
    const win = createMockWindow({ width: 400, height: 300 });

    // x=50 is outside the 20px threshold from any edge
    setWindowPosition(win, 50, 50);

    expect(win.setBounds).toHaveBeenCalledWith({ x: 50, y: 50 });
  });

  it('clamps x when beyond right edge after snapping', () => {
    const win = createMockWindow({ width: 400, height: 300 });

    // Snap to right: 1920-400=1520 — this is valid
    setWindowPosition(win, 1510, 50);

    expect(win.setBounds).toHaveBeenCalledWith({ x: 1520, y: 50 });
  });
});
