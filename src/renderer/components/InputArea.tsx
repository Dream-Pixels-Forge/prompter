import { frameworks, getFramework } from '@/renderer/lib/frameworks';
import { analyzeIntent } from '@/renderer/lib/intent-parser';
import { cancelGeneration, generatePrompt, insertHistory } from '@/renderer/lib/llm';
import { getTemplate } from '@/renderer/lib/templates';
import { useAppStore } from '@/renderer/stores/app-store';
import { usePromptStore } from '@/renderer/stores/prompt-store';
import { ChevronDown, RotateCcw, Send, Sparkles, Square } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MicButton } from './MicButton';

export function InputArea() {
  const {
    input,
    setInput,
    setOutput,
    output,
    setFramework,
    selectedFramework,
    selectedTemplate,
    setTemplate,
    clearOutput,
    error,
    setError,
  } = usePromptStore();
  const { isProcessing, setProcessing, showToast } = useAppStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [frameworkOpen, setFrameworkOpen] = useState(false);
  const [interimText, setInterimText] = useState('');
  const frameworkRef = useRef<HTMLDivElement>(null);
  const manualFrameworkRef = useRef(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const activeRequestIdRef = useRef<string | null>(null);
  const generatingRef = useRef(false);

  const currentTemplate = selectedTemplate ? getTemplate(selectedTemplate) : undefined;
  const currentFramework = getFramework(selectedFramework);

  const placeholder = currentTemplate?.defaultInput || 'Describe what you want to create...';

  const analyzeWithDebounce = useCallback(
    (text: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (text.length > 10) {
          const analysis = analyzeIntent(text);
          // Only auto-switch framework when confidence is above threshold
          // to avoid aggressive switching on partial input
          if (!manualFrameworkRef.current && analysis.confidence >= 0.4) {
            setFramework(analysis.framework.id);
          }
          if (analysis.template && !selectedTemplate && analysis.confidence >= 0.5) {
            setTemplate(analysis.template.id);
          }
        }
      }, 300);
    },
    [selectedTemplate, setFramework, setTemplate],
  );

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    analyzeWithDebounce(input);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, analyzeWithDebounce]);

  // Clear error when input changes — input is the only dependency needed here
  // biome-ignore lint/correctness/useExhaustiveDependencies: error intentionally excluded to prevent reset loop
  useEffect(() => {
    if (input && error) setError(null);
  }, [input]);

  // Auto-resize textarea based on content height
  // biome-ignore lint/correctness/useExhaustiveDependencies: input triggers height recalculation
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    if (generatingRef.current) return; // deduplicate rapid clicks

    generatingRef.current = true;
    setProcessing(true);
    setError(null);
    try {
      const result = await generatePrompt({
        input,
        framework: selectedFramework,
        template: selectedTemplate || undefined,
      });

      // Track requestId for targeted cancellation
      activeRequestIdRef.current = result.requestId;

      // Show warning toast if LLM was unavailable and local fallback was used
      if ('fallbackUsed' in result && result.fallbackUsed) {
        showToast(`⚠ ${result.fallbackReason || 'LLM unavailable — used template fallback'}`);
      }

      setOutput(result);

      // Auto-save to history
      insertHistory({
        id: crypto.randomUUID(),
        rawInput: input,
        structuredOutput: result.raw,
        framework: selectedFramework,
        template: selectedTemplate || undefined,
        createdAt: new Date().toISOString(),
      }).catch((err) => console.error('[History] insert failed:', err));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      // Silent abort — user initiated cancellation, no error toast
      if (message === 'CANCELLED') return;
      setError(message);
      showToast(message);
    } finally {
      generatingRef.current = false;
      setProcessing(false);
    }
  };

  const handleReset = useCallback(() => {
    setInput('');
    clearOutput();
    setTemplate(null);
    setError(null);
    setInterimText('');
    manualFrameworkRef.current = false;
    textareaRef.current?.focus();
  }, [setInput, clearOutput, setTemplate, setError]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  // Close framework dropdown on outside click
  useEffect(() => {
    if (!frameworkOpen) return;
    const handler = (e: MouseEvent) => {
      if (frameworkRef.current && !frameworkRef.current.contains(e.target as Node)) {
        setFrameworkOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [frameworkOpen]);

  const handleTranscript = (text: string) => {
    const currentInput = usePromptStore.getState().input;
    const separator = currentInput && !currentInput.endsWith(' ') ? ' ' : '';
    setInput(currentInput + separator + text);
  };

  const handleInterim = useCallback((text: string) => {
    setInterimText(text);
  }, []);

  return (
    <div className="space-y-2">
      {/* Active template badge */}
      {currentTemplate && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 sub-card">
          <Sparkles className="w-3 h-3 text-accent shrink-0" />
          <span className="text-xs text-white/68 truncate">{currentTemplate.name}</span>
          <button
            type="button"
            onClick={() => setTemplate(null)}
            aria-label="Remove template"
            className="ml-auto text-xs text-white/48 hover:text-white/68 transition-colors px-1.5 py-0.5 rounded hover:bg-white/[0.06]"
          >
            &times;
          </button>
        </div>
      )}

      {/* Framework selector dropdown */}
      {currentFramework && (
        <div ref={frameworkRef} className="relative">
          <button
            type="button"
            onClick={() => setFrameworkOpen(!frameworkOpen)}
            aria-label={`Framework: ${currentFramework.name}. Click to change`}
            aria-expanded={frameworkOpen}
            className="flex items-center gap-1.5 group cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
            <span className="text-[11px] text-white/48 group-hover:text-white/68 transition-colors">
              Framework: <span className="text-accent font-medium">{currentFramework.name}</span>
            </span>
            <ChevronDown
              className={`w-3 h-3 text-white/48 transition-transform duration-200 ${frameworkOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {frameworkOpen && (
            <div
              aria-label="Select framework"
              className="absolute top-full left-0 mt-1.5 bg-surface border border-border rounded-lg shadow-xl overflow-hidden z-50 min-w-[200px] py-1"
            >
              {frameworks.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-current={selectedFramework === f.id ? 'true' : undefined}
                  onClick={() => {
                    manualFrameworkRef.current = true;
                    setFramework(f.id);
                    setFrameworkOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors hover:bg-white/[0.06] ${
                    selectedFramework === f.id ? 'text-white' : 'text-white/68'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedFramework === f.id ? 'bg-accent' : 'bg-white/20'}`}
                  />
                  <span className={selectedFramework === f.id ? 'font-medium' : ''}>{f.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Textarea */}
      <div className="flex justify-end">
        <span className="text-[11px] text-white/48 font-mono" aria-live="polite">
          {input.length}/5000
        </span>
      </div>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={6}
        maxLength={5000}
        aria-label="Prompt input"
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5
                   text-sm text-white/85 placeholder-white/48 resize-none
                   focus:outline-none focus:border-accent/40 focus:bg-white/[0.06]
                   transition-all duration-200 leading-relaxed"
      />
      {interimText && (
        <div className="flex items-center gap-2 px-3 py-2 -mt-0.5 bg-white/[0.02] border-x border-b border-white/[0.06] rounded-b-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse shrink-0" aria-hidden="true" />
          <span className="text-xs text-white/40 italic truncate">{interimText}</span>
        </div>
      )}

      {/* Error — more prominent visibility */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 px-3 py-2.5 bg-red-500/15 border border-red-500/30 rounded-lg"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-0.5" aria-hidden="true" />
          <span className="text-xs text-red-300 leading-relaxed">{error}</span>
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={!input && !output}
          aria-label="Reset input"
          className="w-11 h-11 rounded-xl flex items-center justify-center sub-card hover:bg-white/[0.07] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
          title="Reset"
        >
          <RotateCcw className="w-5 h-5 text-white/48" />
        </button>
        <MicButton onTranscript={handleTranscript} onInterim={handleInterim} disabled={isProcessing} large />
        {isProcessing ? (
          <button
            type="button"
            onClick={() => {
              cancelGeneration(activeRequestIdRef.current ?? undefined);
              activeRequestIdRef.current = null;
            }}
            aria-label="Stop generation"
            className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-500/80 hover:bg-red-500
                         text-white transition-all duration-200 shadow-sm active:scale-[0.97]"
            title="Stop Generation"
          >
            <Square className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!input.trim()}
            aria-label="Generate structured prompt"
            className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-r from-brand-500 to-brand-600
                         hover:from-[#345585] hover:to-[#4A6A9A]
                         disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:from-brand-500 disabled:hover:to-brand-600
                         text-white transition-all duration-200 shadow-sm shadow-brand-500/20 active:scale-[0.97]"
            title="Generate Prompt"
          >
            <Send className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
