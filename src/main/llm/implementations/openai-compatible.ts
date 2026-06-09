import type { ProviderImplementation } from '@/shared/providers';
import { fetchWithTimeout } from '../fetch-with-timeout';

/**
 * Factory for OpenAI-compatible chat completions providers.
 * Most LLM providers (OpenAI, Groq, DeepSeek, Mistral, Together, Fireworks, etc.)
 * expose the same POST /chat/completions interface. This factory eliminates the
 * copy-paste duplication across 9+ provider files.
 */
export function createOpenAICompatibleImpl(
  providerId: string,
  defaultUrl: string,
  extraHeaders?: Record<string, string>,
): ProviderImplementation {
  return {
    providerId,

    async generate({ model, prompt, apiKey, endpoint, signal }) {
      const baseUrl = (endpoint ?? defaultUrl).replace(/\/+$/, '');
      const url = `${baseUrl}/chat/completions`;

      try {
        const res = await fetchWithTimeout(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            ...extraHeaders,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
          }),
          signal,
        });

        if (!res.ok) {
          let detail = `HTTP ${res.status}`;
          try {
            const err = (await res.json()) as { error?: { message?: string } };
            if (err.error?.message) detail += ` — ${err.error.message}`;
          } catch {
            // ignore parse failures
          }
          throw new Error(`${providerId} API error: ${detail}`);
        }

        const data = (await res.json()) as {
          choices?: { message?: { content?: string | null } }[];
        };

        const content = data.choices?.[0]?.message?.content;
        if (content === undefined || content === null) {
          throw new Error(`${providerId} API error: no choices returned`);
        }

        return content;
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw err; // Re-throw user cancellation as-is (orchestrator handles it)
        }
        if (err instanceof DOMException && err.name === 'TimeoutError') {
          throw new Error(`${providerId} API error: request timed out after 60s`);
        }
        throw err;
      }
    },
  };
}
