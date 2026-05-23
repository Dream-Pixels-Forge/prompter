import { fetchWithTimeout } from './fetch-with-timeout';

export const OPENAI_DEFAULT_URL = 'https://api.openai.com/v1';
export const OPENAI_DEFAULT_MODEL = 'gpt-4o';

interface OpenAIRequestOptions {
  model: string;
  prompt: string;
  apiKey: string;
  baseUrl?: string;
}

async function request(url: string, body: unknown, apiKey: string): Promise<Response> {
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json() as { error?: { message?: string } };
      if (err.error?.message) detail += ` — ${err.error.message}`;
    } catch {
      // ignore parse failures
    }
    throw new Error(`OpenAI API error: ${detail}`);
  }

  return res;
}

export async function generateOpenAI(options: OpenAIRequestOptions): Promise<string> {
  const baseUrl = (options.baseUrl || OPENAI_DEFAULT_URL).replace(/\/+$/, '');
  const url = `${baseUrl}/chat/completions`;

  try {
    const res = await request(
      url,
      { model: options.model, messages: [{ role: 'user', content: options.prompt }] },
      options.apiKey,
    );

    const data = (await res.json()) as {
      choices?: { message?: { content?: string | null } }[];
    };

    const content = data.choices?.[0]?.message?.content;
    if (content === undefined || content === null) {
      throw new Error('OpenAI API error: no choices returned');
    }

    return content;
  } catch (err: unknown) {
    if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      throw new Error('OpenAI API error: request timed out after 60s');
    }
    throw err;
  }
}


