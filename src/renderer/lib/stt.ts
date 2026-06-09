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

/** Check if Web Speech API is available in this environment */
export function isWebSpeechAvailable(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Whisper fallback: records audio and sends to OpenAI Whisper API via IPC.
 * Used when Web Speech API is unavailable (e.g., Linux without speech-dispatcher).
 */
async function transcribeWithWhisper(audioBlob: Blob): Promise<string> {
  // Convert Blob to base64
  const arrayBuffer = await audioBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return window.api.stt.transcribe(base64);
}

export class SpeechRecognizer {
  private recognition: SpeechRecognition | null = null;
  private callbacks: SpeechCallbacks;
  private isListening = false;
  private permanentError = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private whisperMode = false;

  constructor(callbacks: SpeechCallbacks) {
    this.callbacks = callbacks;
  }

  /** Start with Web Speech API if available, otherwise fall back to Whisper */
  start(): void {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      // Web Speech API not available — use Whisper fallback
      this.startWhisperFallback();
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
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }
  }

  isActive(): boolean {
    return this.isListening;
  }

  destroy(): void {
    this.stop();
    this.callbacks = { onResult: () => {}, onStateChange: () => {}, onError: () => {} };
  }

  // ── Whisper fallback ─────────────────────────────────

  private async startWhisperFallback(): Promise<void> {
    this.whisperMode = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      this.mediaRecorder = recorder;
      this.audioChunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (this.audioChunks.length === 0) {
          this.callbacks.onStateChange('idle');
          return;
        }
        this.callbacks.onStateChange('processing');
        try {
          const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const text = await transcribeWithWhisper(blob);
          if (text) {
            this.callbacks.onResult(text, true);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Whisper transcription failed';
          this.callbacks.onError(msg);
        } finally {
          this.callbacks.onStateChange('idle');
        }
      };

      recorder.start(1000); // collect data every second
      this.isListening = true;
      this.callbacks.onStateChange('listening');
    } catch (err) {
      const msg = err instanceof DOMException && err.name === 'NotAllowedError'
        ? ERROR_MESSAGES['not-allowed']
        : err instanceof DOMException && err.name === 'NotFoundError'
          ? ERROR_MESSAGES['audio-capture']
          : `Microphone error: ${err instanceof Error ? err.message : 'unknown'}`;
      this.callbacks.onError(msg);
    }
  }
}
