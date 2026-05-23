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
    <div className="relative inline-flex flex-col items-center">
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.3; }
          100% { transform: scale(1); opacity: 0.6; }
        }
        .animate-pulse-ring {
          animation: pulse-ring 1.5s ease-in-out infinite;
        }
      `}</style>
      <button
        onClick={handleToggle}
        disabled={!canInteract}
        title={state === 'listening' ? 'Listening...' : 'Click to speak'}
        className={`
          relative w-8 h-8 rounded-full flex items-center justify-center
          transition-colors duration-200
          ${state === 'listening'
            ? 'bg-red-500/20'
            : 'bg-white/[0.04] hover:bg-white/[0.08]'
          }
          ${!canInteract ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {state === 'listening' && (
          <span className="absolute inset-0 rounded-full animate-pulse-ring border-2 border-red-500/60" />
        )}
        {state === 'processing' ? (
          <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
        ) : (
          <Mic className={`w-4 h-4 ${state === 'listening' ? 'text-red-400' : 'text-white/60'}`} />
        )}
      </button>
      {interimText && (
        <span className="absolute top-full mt-1.5 text-[10px] text-white/30 whitespace-nowrap max-w-[120px] truncate">
          {interimText}
        </span>
      )}
    </div>
  );
}
