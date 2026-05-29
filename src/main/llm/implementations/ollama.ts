import type { ProviderImplementation } from '@/shared/providers';
import type { OllamaStatus } from '@/shared/types';
import { fetchWithTimeout } from '../fetch-with-timeout';

const OLLAMA_DEFAULT_URL = 'http://localhost:11434';

export const ollamaImpl: ProviderImplementation = {
  providerId: 'ollama',

  async generate({ model, prompt, endpoint, signal }) {
    const baseUrl = (endpoint ?? OLLAMA_DEFAULT_URL).replace(/\/+$/, '');
    const url = `${baseUrl}/api/generate`;

    try {
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: false }),
        signal,
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
  },

  async check({ endpoint } = {}) {
    const normalized = (endpoint ?? OLLAMA_DEFAULT_URL).replace(/\/+$/, '');

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

      return {
        available: true,
        message: JSON.stringify({
          version: versionData.version as string,
          models: (tagsData.models ?? []).map((m: { name: string }) => m.name),
        }),
      };
    } catch {
      return { available: false };
    }
  },
};

/** Backward-compatible checkOllamaStatus for IPC handler */
export async function checkOllamaStatus(baseUrl?: string): Promise<OllamaStatus> {
  const check = ollamaImpl.check;
  if (!check) {
    return { available: false };
  }
  const result = await check({ endpoint: baseUrl });
  if (!result.available) {
    return { available: false };
  }
  try {
    const parsed = JSON.parse(result.message ?? '{}');
    return {
      available: true,
      version: parsed.version,
      models: parsed.models,
    };
  } catch {
    return { available: false };
  }
}
