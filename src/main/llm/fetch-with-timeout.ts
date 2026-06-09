const DEFAULT_TIMEOUT = 60_000;

/**
 * HTTP fetch wrapper with timeout, external abort signal merging, and retry logic
 * for transient errors (429, 502, 503, 504, network errors).
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number; retries?: number } = {},
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, retries = 2, signal: externalSignal, ...fetchOptions } = options;

  // If external signal is already aborted, fail fast
  if (externalSignal?.aborted) {
    throw new DOMException('The operation was aborted', 'AbortError');
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();

    // Merge external abort signal with timeout controller
    const onExternalAbort = () => {
      if (externalSignal?.aborted) {
        controller.abort(externalSignal.reason);
      }
    };

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort(externalSignal.reason);
      } else {
        externalSignal.addEventListener('abort', onExternalAbort, { once: true });
      }
    }

    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, { ...fetchOptions, signal: controller.signal });

      // If successful or non-retryable client error (4xx except 429), return immediately
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
        return res;
      }

      // Retryable server error or rate limit
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`HTTP ${res.status}`);
        // If this was the last attempt, return the response anyway (let caller handle it)
        if (attempt === retries) {
          return res;
        }
        // Use Retry-After header if present, otherwise exponential backoff
        const retryAfter = res.headers.get('Retry-After');
        let backoffMs: number;
        if (retryAfter) {
          const parsed = Number(retryAfter);
          backoffMs = Number.isFinite(parsed) && parsed > 0 ? parsed * 1000 : 500 * 2 ** attempt + Math.random() * 500;
        } else {
          backoffMs = 500 * 2 ** attempt + Math.random() * 500;
        }
        await sleep(backoffMs);
        continue;
      }

      return res;
    } catch (err) {
      lastError = err;

      // Don't retry if explicitly aborted by user
      if (err instanceof DOMException && err.name === 'AbortError' && externalSignal?.aborted) {
        throw err;
      }

      // Don't retry on last attempt
      if (attempt === retries) {
        throw err;
      }

      // Retry on network errors and timeouts
      const isRetryable =
        err instanceof TypeError || // network error
        (err instanceof DOMException && err.name === 'TimeoutError');

      if (!isRetryable) {
        throw err;
      }

      const backoffMs = 500 * 2 ** attempt + Math.random() * 500;
      await sleep(backoffMs);
    } finally {
      clearTimeout(timer);
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError ?? new Error('fetchWithTimeout: all retries exhausted');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
