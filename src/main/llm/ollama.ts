import { type OllamaStatus } from '../../shared/types';

export const OLLAMA_DEFAULT_URL = 'http://localhost:11434';

export async function generateOllama(options: {
  model: string;
  prompt: string;
  baseUrl?: string;
}): Promise<string> {
  const baseUrl = (options.baseUrl ?? OLLAMA_DEFAULT_URL).replace(/\/+$/, '');
  const url = `${baseUrl}/api/generate`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: options.model, prompt: options.prompt, stream: false }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Ollama API error (${res.status}): ${body || res.statusText}`);
    }

    const data = await res.json();
    return data.response as string;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Ollama request timed out after 60 seconds');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkOllamaStatus(baseUrl?: string): Promise<OllamaStatus> {
  const normalized = (baseUrl ?? OLLAMA_DEFAULT_URL).replace(/\/+$/, '');

  try {
    const [tagsRes, versionRes] = await Promise.all([
      fetch(`${normalized}/api/tags`),
      fetch(`${normalized}/api/version`),
    ]);

    if (!tagsRes.ok || !versionRes.ok) {
      return { available: false };
    }

    const tagsData = await tagsRes.json();
    const versionData = await versionRes.json();

    const models: string[] = (tagsData.models ?? []).map(
      (m: { name: string }) => m.name,
    );

    return {
      available: true,
      version: versionData.version as string,
      models,
    };
  } catch {
    return { available: false };
  }
}

export async function streamOllama(
  options: { model: string; prompt: string; baseUrl?: string },
  onChunk: (text: string) => void,
): Promise<string> {
  const baseUrl = (options.baseUrl ?? OLLAMA_DEFAULT_URL).replace(/\/+$/, '');
  const url = `${baseUrl}/api/generate`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  const chunks: string[] = [];

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: options.model, prompt: options.prompt, stream: true }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Ollama API error (${res.status}): ${body || res.statusText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error('Ollama response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            chunks.push(parsed.response);
            onChunk(parsed.response);
          }
        } catch {
          // skip malformed lines
        }
      }
    }

    // process remaining buffer
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer);
        if (parsed.response) {
          chunks.push(parsed.response);
          onChunk(parsed.response);
        }
      } catch {
        // skip
      }
    }

    return chunks.join('');
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Ollama stream request timed out after 60 seconds');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
