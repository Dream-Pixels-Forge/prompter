import { type GenerateRequest, type GenerateResponse, type AppSettings, type OllamaStatus } from '@/shared/types';

declare global {
  interface Window {
    api: {
      llm: {
        generate: (req: GenerateRequest) => Promise<GenerateResponse>;
      };
      clipboard: {
        write: (text: string) => Promise<boolean>;
      };
      window: {
        setBounds: (bounds: { x: number; y: number }) => Promise<boolean>;
        toggle: () => Promise<boolean>;
      };
      settings: {
        get: () => Promise<Partial<AppSettings>>;
        set: (settings: Partial<AppSettings>) => Promise<boolean>;
      };
      ollama: {
        check: () => Promise<OllamaStatus>;
      };
      stt: {
        transcribe: (audioData: string) => Promise<string>;
      };
    };
  }
}

export async function generatePrompt(req: GenerateRequest): Promise<GenerateResponse> {
  return window.api.llm.generate(req);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  return window.api.clipboard.write(text);
}
