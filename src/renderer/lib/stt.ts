export type SpeechState = 'idle' | 'listening' | 'processing' | 'error';

export interface SpeechCallbacks {
  onResult: (text: string, isFinal: boolean) => void;
  onStateChange: (state: SpeechState) => void;
  onError: (error: string) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone access denied. Allow microphone access and try again.',
  'audio-capture': 'No microphone found. Connect a microphone and try again.',
  'service-not-allowed': 'Speech service unavailable. Try again later.',
};

export class SpeechRecognizer {
  private recognition: SpeechRecognition | null = null;
  private callbacks: SpeechCallbacks;
  private isListening = false;
  private permanentError = false;

  constructor(callbacks: SpeechCallbacks) {
    this.callbacks = callbacks;
  }

  start(): void {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

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
      if (this.isListening && !this.permanentError) {
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
      if (event.error === 'no-speech' || event.error === 'aborted' || event.error === 'network') {
        return;
      }
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this.permanentError = true;
      }
      const msg = ERROR_MESSAGES[event.error] || `Speech error: ${event.error}`;
      this.callbacks.onError(msg);
      this.callbacks.onStateChange('error');
    };

    this.recognition = recognition;
    this.isListening = true;
    this.permanentError = false;
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
