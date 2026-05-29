import type { ProviderImplementation } from '@/shared/providers';
import { fetchWithTimeout } from '../fetch-with-timeout';

export const fireworksImpl: ProviderImplementation = {
  providerId: 'fireworks',

  async generate({ model, prompt, apiKey, endpoint, signal }) {
    const baseUrl = (endpoint ?? 'https://api.fireworks.ai/inference/v1').replace(/\/+$/, '');
    const url = `${baseUrl}/chat/completions`;

    try {
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
          const err = (await res.json()) as { error?: { message?: string } };
          if (err.error?.message) detail += ` — ${err.error.message}`;
        } catch {
          // ignore parse failures
        }
        throw new Error(`Fireworks AI API error: ${detail}`);
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string | null } }[];
      };

      const content = data.choices?.[0]?.message?.content;
      if (content === undefined || content === null) {
        throw new Error('Fireworks AI API error: no choices returned');
      }

      return content;
    } catch (err: unknown) {
      if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        throw new Error('Fireworks AI API error: request timed out after 60s');
      }
      throw err;
    }
  },
};
