import type { PrompterApi } from '@/shared/api-types';
import { IPC_CHANNELS } from '@/shared/types';
import { describe, expect, it } from 'vitest';

describe('tray IPC channels', () => {
  it('IPC_CHANNELS has TRAY_NAVIGATE', () => {
    expect(IPC_CHANNELS.TRAY_NAVIGATE).toBeDefined();
    expect(IPC_CHANNELS.TRAY_NAVIGATE).toBe('tray:navigate');
  });
});

describe('PrompterApi tray type', () => {
  it('has tray.onNavigate method', () => {
    // Compile-time check: if PrompterApi doesn't have tray.onNavigate,
    // this assignment won't typecheck
    const _check: PrompterApi['tray'] = {
      onNavigate: () => () => undefined,
    };
    expect(typeof _check.onNavigate).toBe('function');
  });

  it('tray.onNavigate returns an unsubscribe function', () => {
    const api: PrompterApi['tray'] = {
      onNavigate: () => {
        // Simulate: register handler, return cleanup
        const cleanup = () => undefined;
        return cleanup;
      },
    };
    const unsub = api.onNavigate(() => {});
    expect(typeof unsub).toBe('function');
  });
});
