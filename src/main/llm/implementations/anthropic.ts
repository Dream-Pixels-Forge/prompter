import type { ProviderImplementation } from '@/shared/providers';
import { fetchWithTimeout } from '../fetch-with-timeout';

const ANTHROPIC_API_VERSION = '2023-06-01';

interface AnthropicResponse {
  content: { type: string; text: string }[];
  model: string;
  stop_reason: string;
  usage: { input_tokens: number; output_tokens: number };
}

export const anthropicImpl: ProviderImplementation = {
  providerId: 'anthropic',

  async generate({ model, prompt, apiKey, endpoint, signal }) {
    const baseUrl = (endpoint ?? 'https://api.anthropic.com').replace(/\/+$/, '');
    const url = `${baseUrl}/v1/messages`;

    try {
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey ?? '',
          'anthropic-version': ANTHROPIC_API_VERSION,
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Anthropic authentication failed (401). Check your API key.');
        }
        if (response.status === 429) {
          throw new Error('Anthropic rate limit exceeded (429). Try again later.');
        }
        // Sanitize: only include status, never the response body (could leak API keys or user data)
        throw new Error(`Anthropic API error (${response.status})`);
      }

      const data: AnthropicResponse = await response.json();
      const text = data.content?.[0]?.text;
      if (text === undefined || text === null) {
        throw new Error('Anthropic response missing content[0].text');
      }
      return text;
    } catch (err) {
      if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        throw new Error('Anthropic request timed out after 60 seconds');
      }
      throw err;
    }
  },
};
