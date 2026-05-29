import type { ProviderImplementation } from '@/shared/providers';
import { fetchWithTimeout } from '../fetch-with-timeout';

const DEFAULT_URL = 'https://openrouter.ai/api/v1';

export const openrouterImpl: ProviderImplementation = {
  providerId: 'openrouter',

  async generate({ model, prompt, apiKey, endpoint, signal }) {
    const baseUrl = (endpoint ?? DEFAULT_URL).replace(/\/+$/, '');
    const url = `${baseUrl}/chat/completions`;

    try {
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://prompter.app',
          'X-Title': 'Prompter',
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
        throw new Error(`OpenRouter API error: ${detail}`);
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string | null } }[];
      };

      const content = data.choices?.[0]?.message?.content;
      if (content === undefined || content === null) {
        throw new Error('OpenRouter API error: no choices returned');
      }

      return content;
    } catch (err: unknown) {
      if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        throw new Error('OpenRouter API error: request timed out after 60s');
      }
      throw err;
    }
  },
};
