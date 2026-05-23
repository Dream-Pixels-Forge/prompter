import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { SpeechRecognizer } from '@/renderer/lib/stt';
import { useAppStore } from '@/renderer/stores/app-store';

interface MicButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function MicButton({ onTranscript, disabled }: MicButtonProps) {
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
          setState('idle');
          clearSilenceTimeout();
          onTranscript(text);
        } else {
          setInterimText(text);
          resetSilenceTimeout();
        }
      },
      onStateChange: (newState) => {
        if (newState === 'idle') {
          setState('idle');
          setInterimText('');
        }
      },
      onError: (error) => {
        showToast(error);
        setState('idle');
        setInterimText('');
      },
    });

    recognizerRef.current = recognizer;
    recognizer.start();
    setState('listening');
    resetSilenceTimeout();
  }, [state, disabled, onTranscript, clearSilenceTimeout, resetSilenceTimeout, showToast]);

  const canInteract = state === 'listening' || (!disabled && state === 'idle');

  return (
    <div className="relative inline-flex flex-col items-center overflow-visible">
      <button
        onClick={handleToggle}
        disabled={!canInteract}
        title={state === 'listening' ? 'Listening...' : 'Click to speak'}
        className={`
          relative w-11 h-11 rounded-xl flex items-center justify-center
          transition-all duration-200
          ${state === 'listening'
            ? 'bg-red-500/15 border border-red-500/25 shadow-sm shadow-red-500/10'
            : 'sub-card hover:bg-white/[0.07]'
          }
          ${!canInteract ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {state === 'listening' && (
          <span className="absolute inset-0 rounded-xl animate-pulse-ring border border-red-500/40" />
        )}
        {state === 'processing' ? (
          <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
        ) : (
          <Mic className={`w-4 h-4 ${state === 'listening' ? 'text-red-400' : 'text-white/50'}`} />
        )}
      </button>

      {/* Interim text — positioned below button, clipped to card-safe width */}
      {interimText && (
        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 text-[10px] text-white/30 whitespace-nowrap max-w-[140px] truncate text-center pointer-events-none">
          {interimText}
        </span>
      )}
    </div>
  );
}
