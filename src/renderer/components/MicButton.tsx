import { SpeechRecognizer } from '@/renderer/lib/stt';
import { useAppStore } from '@/renderer/stores/app-store';
import { Loader2, Mic } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface MicButtonProps {
  onTranscript: (text: string) => void;
  onInterim?: (text: string) => void;
  disabled?: boolean;
  large?: boolean;
}

export function MicButton({ onTranscript, onInterim, disabled, large = false }: MicButtonProps) {
  const [state, setState] = useState<'idle' | 'listening' | 'processing'>('idle');
  const [interimText, setInterimText] = useState('');
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useAppStore((s) => s.showToast);

  const clearSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  const resetSilenceTimeout = useCallback(() => {
    clearSilenceTimeout();
    silenceTimeoutRef.current = setTimeout(() => {
      recognizerRef.current?.stop();
    }, 10000);
  }, [clearSilenceTimeout]);

  useEffect(() => {
    return () => {
      clearSilenceTimeout();
      recognizerRef.current?.destroy();
    };
  }, [clearSilenceTimeout]);

  const handleToggle = useCallback(() => {
    if (state === 'listening') {
      setState('processing');
      recognizerRef.current?.stop();
      return;
    }

    if (disabled) return;

    const recognizer = new SpeechRecognizer({
      onResult: (text, isFinal) => {
        if (isFinal) {
          setInterimText('');
          onInterim?.('');
          setState('idle');
          clearSilenceTimeout();
          onTranscript(text);
        } else {
          setInterimText(text);
          onInterim?.(text);
          resetSilenceTimeout();
        }
      },
      onStateChange: (newState) => {
        if (newState === 'idle') {
          setState('idle');
          setInterimText('');
          onInterim?.('');
        }
      },
      onError: (error) => {
        showToast(error);
        setState('idle');
        setInterimText('');
        onInterim?.('');
      },
    });

    recognizerRef.current = recognizer;
    recognizer.start();
    setState('listening');
    resetSilenceTimeout();
  }, [state, disabled, onTranscript, onInterim, clearSilenceTimeout, resetSilenceTimeout, showToast]);

  const canInteract = state === 'listening' || (!disabled && state === 'idle');

  return (
    <div className="relative inline-flex flex-col items-center overflow-visible">
      <button type="button"
        onClick={handleToggle}
        disabled={!canInteract}
        title={state === 'listening' ? 'Listening...' : 'Click to speak'}
        className={`
          relative ${large ? 'w-16 h-16 rounded-2xl' : 'w-9 h-9 rounded-md'} flex items-center justify-center
          transition-all duration-200
          ${
            state === 'listening'
              ? 'bg-red-500/15 border border-red-500/25 shadow-sm shadow-red-500/10'
              : 'sub-card hover:bg-white/[0.07]'
          }
          ${!canInteract ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {state === 'listening' && (
          <span className="absolute inset-0 rounded-2xl animate-pulse-ring border border-red-500/40" />
        )}
        {state === 'processing' ? (
          <Loader2 className={`${large ? 'w-6 h-6' : 'w-4 h-4'} text-white/48 animate-spin`} />
        ) : (
          <Mic className={`${large ? 'w-6 h-6' : 'w-4 h-4'} ${state === 'listening' ? 'text-red-400' : 'text-white/48'}`} />
        )}
      </button>
    </div>
  );
}
