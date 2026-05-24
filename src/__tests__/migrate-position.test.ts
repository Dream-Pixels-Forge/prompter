import { migratePosition } from '@/renderer/hooks/useBubblePosition';
import { describe, expect, it } from 'vitest';

describe('migratePosition', () => {
  it('returns new-format position (bottom + right) as-is', () => {
    expect(migratePosition({ bottom: 104, right: 44 })).toEqual({
      bottom: 104,
      right: 44,
    });
  });

  it('converts old-format position (x + y) using 24 offset', () => {
    expect(migratePosition({ x: 10, y: 10 })).toEqual({
      bottom: 14,
      right: 14,
    });
  });

  it('returns new-format with different values', () => {
    expect(migratePosition({ bottom: 200, right: 50 })).toEqual({
      bottom: 200,
      right: 50,
    });
  });

  it('returns default position for empty object', () => {
    expect(migratePosition({})).toEqual({ bottom: 104, right: 44 });
  });

  it('returns default position when x is present but y is missing', () => {
    expect(migratePosition({ x: 100 })).toEqual({ bottom: 104, right: 44 });
  });
});
