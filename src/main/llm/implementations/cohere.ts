import type { ProviderImplementation } from '@/shared/providers';
import { fetchWithTimeout } from '../fetch-with-timeout';

const DEFAULT_URL = 'https://api.cohere.com/v2';

export const cohereImpl: ProviderImplementation = {
  providerId: 'cohere',

  async generate({ model, prompt, apiKey, endpoint, signal }) {
    const baseUrl = (endpoint ?? DEFAULT_URL).replace(/\/+$/, '');
    const url = `${baseUrl}/chat`;

    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
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
        const err = (await res.json()) as { message?: string };
        if (err.message) detail += ` — ${err.message}`;
      } catch {
        // ignore parse failures
      }
      throw new Error(`Cohere API error: ${detail}`);
    }

    const data = (await res.json()) as {
      message?: { content?: { text?: string }[] };
    };

    const text = data.message?.content?.[0]?.text;
    if (!text) throw new Error('Cohere: no content in response');
    return text;
  },
};
