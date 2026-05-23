import { type OllamaStatus } from '../../shared/types';
import { fetchWithTimeout } from './fetch-with-timeout';

export const OLLAMA_DEFAULT_URL = 'http://localhost:11434';

export async function generateOllama(options: {
  model: string;
  prompt: string;
  baseUrl?: string;
}): Promise<string> {
  const baseUrl = (options.baseUrl ?? OLLAMA_DEFAULT_URL).replace(/\/+$/, '');
  const url = `${baseUrl}/api/generate`;

  try {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: options.model, prompt: options.prompt, stream: false }),
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
  }
}

export async function checkOllamaStatus(baseUrl?: string): Promise<OllamaStatus> {
  const normalized = (baseUrl ?? OLLAMA_DEFAULT_URL).replace(/\/+$/, '');

  try {
    const [tagsRes, versionRes] = await Promise.all([
      fetchWithTimeout(`${normalized}/api/tags`, { method: 'GET', timeout: 5000 }),
      fetchWithTimeout(`${normalized}/api/version`, { method: 'GET', timeout: 5000 }),
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


