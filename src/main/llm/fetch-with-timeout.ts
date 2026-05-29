export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {},
): Promise<Response> {
  const { timeout = 60000, signal: externalSignal, ...fetchOptions } = options;
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
    return res;
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}
