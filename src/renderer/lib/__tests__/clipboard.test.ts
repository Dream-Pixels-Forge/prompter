import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { copyText } from '../clipboard';

describe('copyText', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {});
    vi.stubGlobal('navigator', {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true when window.api.clipboard.write succeeds', async () => {
    const mockWrite = vi.fn().mockResolvedValue(undefined);
    (window as any).api = { clipboard: { write: mockWrite } };

    const result = await copyText('test content');
    expect(result).toBe(true);
    expect(mockWrite).toHaveBeenCalledWith('test content');
  });

  it('falls back to navigator.clipboard.writeText when IPC fails', async () => {
    const mockWrite = vi.fn().mockRejectedValue(new Error('IPC failed'));
    (window as any).api = { clipboard: { write: mockWrite } };
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    (navigator as any).clipboard = { writeText: mockWriteText };

    const result = await copyText('fallback content');
    expect(result).toBe(true);
    expect(mockWriteText).toHaveBeenCalledWith('fallback content');
  });

  it('returns false when all copy methods fail', async () => {
    const mockWrite = vi.fn().mockRejectedValue(new Error('IPC failed'));
    (window as any).api = { clipboard: { write: mockWrite } };
    const mockWriteText = vi.fn().mockRejectedValue(new Error('Browser API failed'));
    (navigator as any).clipboard = { writeText: mockWriteText };

    const result = await copyText('fail content');
    expect(result).toBe(false);
  });

  it('handles missing window.api gracefully', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    (navigator as any).clipboard = { writeText: mockWriteText };

    const result = await copyText('no api content');
    expect(result).toBe(true);
    expect(mockWriteText).toHaveBeenCalledWith('no api content');
  });
});
