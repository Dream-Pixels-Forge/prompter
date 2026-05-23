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

interface AnthropicStreamChunk {
  type: 'content_block_delta' | 'content_block_start' | 'message_start' | 'message_delta' | 'message_stop' | 'ping' | 'error';
  delta?: { text?: string; type?: string };
  error?: { type: string; message: string };
}

export async function generateAnthropic(options: AnthropicOptions): Promise<string> {
  const { model, prompt, apiKey, baseUrl } = options;
  const url = `${baseUrl ?? ANTHROPIC_DEFAULT_URL}/v1/messages`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(url, {
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
      signal: controller.signal,
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
  } finally {
    clearTimeout(timeout);
  }
}

export async function streamAnthropic(
  options: AnthropicOptions,
  onChunk: (text: string) => void,
): Promise<string> {
  const { model, prompt, apiKey, baseUrl } = options;
  const url = `${baseUrl ?? ANTHROPIC_DEFAULT_URL}/v1/messages`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
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

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Anthropic streaming response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    const processLines = () => {
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const json = line.slice(6).trim();
        if (!json) continue;
        if (json === '[DONE]') return;

        try {
          const chunk: AnthropicStreamChunk = JSON.parse(json);
          if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
            onChunk(chunk.delta.text);
            fullText += chunk.delta.text;
          }
          if (chunk.type === 'error') {
            throw new Error(chunk.error?.message ?? 'Anthropic streaming error');
          }
        } catch {
          // skip malformed lines
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      processLines();
    }
    // flush remaining buffer
    processLines();

    return fullText;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Anthropic request timed out after 60 seconds');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
