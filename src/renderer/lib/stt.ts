// ── Web Speech API type declarations ──────────────────
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
// ──────────────────────────────────────────────────────

export type SpeechState = 'idle' | 'listening' | 'processing' | 'error';

export interface SpeechCallbacks {
  onResult: (text: string, isFinal: boolean) => void;
  onStateChange: (state: SpeechState) => void;
  onError: (error: string) => void;
}

export class SpeechRecognizer {
  private recognition: SpeechRecognition | null = null;
  private callbacks: SpeechCallbacks;
  private isListening = false;

  constructor(callbacks: SpeechCallbacks) {
    this.callbacks = callbacks;
  }

  start(): void {
    const SpeechRecognitionCtor: new () => SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      this.callbacks.onError('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.callbacks.onResult(finalTranscript, true);
      }
      if (interimTranscript) {
        this.callbacks.onResult(interimTranscript, false);
      }
    };

    recognition.onend = () => {
      if (this.isListening) {
        try {
          recognition.start();
        } catch {
          // Ignore if already started
        }
      } else {
        this.callbacks.onStateChange('idle');
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      this.callbacks.onError(`Speech error: ${event.error}`);
      this.callbacks.onStateChange('error');
    };

    this.recognition = recognition;
    this.isListening = true;
    this.callbacks.onStateChange('listening');
    recognition.start();
  }

  stop(): void {
    this.isListening = false;
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
  }

  isActive(): boolean {
    return this.isListening;
  }

  destroy(): void {
    this.stop();
    this.callbacks = { onResult: () => {}, onStateChange: () => {}, onError: () => {} };
  }
}

export function isSpeechSupported(): boolean {
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}
