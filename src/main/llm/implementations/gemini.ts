import type { ProviderImplementation } from '@/shared/providers';
import { fetchWithTimeout } from '../fetch-with-timeout';

const DEFAULT_URL = 'https://generativelanguage.googleapis.com/v1beta';

export const geminiImpl: ProviderImplementation = {
  providerId: 'gemini',

  async generate({ model, prompt, apiKey, endpoint, signal }) {
    const baseUrl = (endpoint ?? DEFAULT_URL).replace(/\/+$/, '');
    const url = `${baseUrl}/models/${model}:generateContent`;

    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey ?? '' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
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
      throw new Error(`Gemini API error: ${detail}`);
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini: no content in response');
    return text;
  },
};
