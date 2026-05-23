export const WHISPER_DEFAULT_URL = 'https://api.openai.com/v1';
export const WHISPER_DEFAULT_MODEL = 'whisper-1';

export async function transcribeAudio(audioBase64: string, apiKey: string): Promise<string> {
  const boundary = `----PrompterFormBoundary${crypto.randomUUID().replace(/-/g, '')}`;

  // Decode base64 audio
  const binaryStr = atob(audioBase64);
  const audioBytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    audioBytes[i] = binaryStr.charCodeAt(i);
  }

  // Build multipart body
  const encoder = new TextEncoder();
  const headerStr = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="audio.wav"\r\nContent-Type: audio/wav\r\n\r\n`;
  const footerStr = `\r\n--${boundary}--\r\n`;

  const header = encoder.encode(headerStr);
  const footer = encoder.encode(footerStr);
  const body = new Uint8Array(header.length + audioBytes.length + footer.length);
  body.set(header, 0);
  body.set(audioBytes, header.length);
  body.set(footer, header.length + audioBytes.length);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(`${WHISPER_DEFAULT_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${apiKey}`,
      },
      body: body as any,
      signal: controller.signal,
    });

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const err = await res.json() as { error?: { message?: string } };
        if (err.error?.message) detail += ` — ${err.error.message}`;
      } catch { /* ignore */ }
      throw new Error(`Whisper API error: ${detail}`);
    }

    const data = (await res.json()) as { text?: string };
    if (!data.text) throw new Error('Whisper API error: no transcription returned');
    return data.text;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Whisper API error: request timed out after 30s');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
