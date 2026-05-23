import { fetchWithTimeout } from './fetch-with-timeout';

export const ANTHROPIC_DEFAULT_URL = 'https://api.anthropic.com';
export const ANTHROPIC_DEFAULT_MODEL = 'claude-sonnet-4-20250514';

interface AnthropicOptions {
  model: string;
  prompt: string;
  apiKey: string;
  baseUrl?: string;
}

interface AnthropicResponse {
  content: { type: string; text: string }[];
  model: string;
  stop_reason: string;
  usage: { input_tokens: number; output_tokens: number };
}

export async function generateAnthropic(options: AnthropicOptions): Promise<string> {
  const { model, prompt, apiKey, baseUrl } = options;
  const url = `${baseUrl ?? ANTHROPIC_DEFAULT_URL}/v1/messages`;

  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      if (response.status === 401) {
        throw new Error(`Anthropic authentication failed (401). Check your API key.`);
      }
      if (response.status === 429) {
        throw new Error(`Anthropic rate limit exceeded (429). Try again later.`);
      }
      throw new Error(`Anthropic API error ${response.status}${body ? `: ${body}` : ''}`);
    }

    const data: AnthropicResponse = await response.json();
    const text = data.content?.[0]?.text;
    if (text === undefined || text === null) {
      throw new Error('Anthropic response missing content[0].text');
    }
    return text;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Anthropic request timed out after 60 seconds');
    }
    throw err;
  }
}


