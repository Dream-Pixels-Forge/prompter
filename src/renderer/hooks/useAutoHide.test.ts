// @vitest-environment jsdom
import { useAppStore } from '@/renderer/stores/app-store';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAutoHide } from './useAutoHide';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  // Reset the store to defaults
  useAppStore.setState({ isProcessing: false });
});

describe('useAutoHide', () => {
  it('starts with opacity 1 and returns a resetTimer function', () => {
    const { result } = renderHook(() => useAutoHide(5000));

    expect(result.current.opacity).toBe(1);
    expect(typeof result.current.resetTimer).toBe('function');
  });

  it('fades to 0.3 after the configured delay when idle', () => {
    const { result } = renderHook(() => useAutoHide(5000));

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.opacity).toBe(0.3);
  });

  it('does not auto-hide before the delay elapses', () => {
    const { result } = renderHook(() => useAutoHide(5000));

    act(() => {
      vi.advanceTimersByTime(4999);
    });

    expect(result.current.opacity).toBe(1);
  });

  it('resets opacity to 1 when resetTimer is called after auto-hide', () => {
    const { result } = renderHook(() => useAutoHide(5000));

    // Wait for auto-hide
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.opacity).toBe(0.3);

    // Reset
    act(() => {
      result.current.resetTimer();
    });
    expect(result.current.opacity).toBe(1);
  });

  it('restarts the fade timer after resetTimer is called', () => {
    const { result } = renderHook(() => useAutoHide(5000));

    // Wait for auto-hide
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.opacity).toBe(0.3);

    // Reset
    act(() => {
      result.current.resetTimer();
    });
    expect(result.current.opacity).toBe(1);

    // Should fade again after another 5s
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.opacity).toBe(0.3);
  });

  it('stays at opacity 1 when isProcessing is true', () => {
    useAppStore.setState({ isProcessing: true });

    const { result } = renderHook(() => useAutoHide(5000));

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.opacity).toBe(1);
  });

  it('recovers from processing: stays at 1 during processing, then auto-hides after idle', () => {
    useAppStore.setState({ isProcessing: true });

    const { result } = renderHook(() => useAutoHide(5000));

    // Advance time while processing
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.opacity).toBe(1);

    // Stop processing
    act(() => {
      useAppStore.setState({ isProcessing: false });
    });

    // Should start the timer now
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.opacity).toBe(0.3);
  });

  it('uses the provided delay value', () => {
    const { result } = renderHook(() => useAutoHide(2000));

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(result.current.opacity).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.opacity).toBe(0.3);
  });
});
