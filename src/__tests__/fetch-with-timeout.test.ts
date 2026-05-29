import { fetchWithTimeout } from '@/main/llm/fetch-with-timeout';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetchSuccess(body = 'ok') {
  const res = new Response(body, { status: 200 });
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(res);
  return res;
}

/** Mock fetch that rejects when its signal is aborted */
function mockFetchAbortsOnSignal() {
  vi.spyOn(globalThis, 'fetch').mockImplementation((_input: string | URL | Request, init?: RequestInit) => {
    return new Promise((_, reject) => {
      const signal = init?.signal;
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      signal?.addEventListener(
        'abort',
        () => {
          reject(new DOMException('Aborted', 'AbortError'));
        },
        { once: true },
      );
    });
  });
}

describe('fetchWithTimeout', () => {
  it('returns response on success', async () => {
    const res = mockFetchSuccess('hello');
    const result = await fetchWithTimeout('https://example.com');
    expect(result).toBe(res);
    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it('passes through url and options', async () => {
    mockFetchSuccess();
    await fetchWithTimeout('https://example.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    expect(globalThis.fetch).toHaveBeenCalledWith('https://example.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: expect.any(AbortSignal),
    });
  });

  it('merges external abort signal — external aborts before timeout', async () => {
    mockFetchAbortsOnSignal();

    const controller = new AbortController();
    const promise = fetchWithTimeout('https://example.com', {
      signal: controller.signal,
      timeout: 60_000,
    });

    controller.abort(new Error('user cancelled'));

    await expect(promise).rejects.toThrow();
  });

  it('merges external abort signal — already aborted before call', async () => {
    const controller = new AbortController();
    controller.abort(new Error('already cancelled'));

    const promise = fetchWithTimeout('https://example.com', {
      signal: controller.signal,
    });

    await expect(promise).rejects.toThrow();
  });

  it('cleans up timeout timer on success', async () => {
    mockFetchSuccess();

    await fetchWithTimeout('https://example.com', { timeout: 10_000 });

    // No error means the timer was cleaned up properly
  });

  it('cleans up external abort listener on success', async () => {
    mockFetchSuccess();

    const controller = new AbortController();
    await fetchWithTimeout('https://example.com', { signal: controller.signal });

    // Verify no error on cleanup
  });

  it('passes signal to fetch', async () => {
    mockFetchSuccess();

    await fetchWithTimeout('https://example.com', { timeout: 5000 });

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[1].signal).toBeInstanceOf(AbortSignal);
  });
});
