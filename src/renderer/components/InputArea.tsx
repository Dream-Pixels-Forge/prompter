import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { MicButton } from './MicButton';
import { useAppStore } from '@/renderer/stores/app-store';
import { usePromptStore } from '@/renderer/stores/prompt-store';
import { generatePrompt, insertHistory } from '@/renderer/lib/llm';
import { analyzeIntent } from '@/renderer/lib/intent-parser';
import { templates, getTemplate } from '@/renderer/lib/templates';
import { getFramework } from '@/renderer/lib/frameworks';

export function InputArea() {
  const { input, setInput, setOutput, setFramework, selectedFramework, selectedTemplate, setTemplate, error, setError } = usePromptStore();
  const { isProcessing, setProcessing, showToast } = useAppStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const currentTemplate = selectedTemplate ? getTemplate(selectedTemplate) : undefined;
  const currentFramework = getFramework(selectedFramework);

  const placeholder = currentTemplate?.defaultInput || 'Describe what you want to create...';

  const analyzeWithDebounce = useCallback((text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (text.length > 10) {
        const analysis = analyzeIntent(text);
        setFramework(analysis.framework.id);
        if (analysis.template && !selectedTemplate) {
          setTemplate(analysis.template.id);
        }
      }
    }, 300);
  }, [selectedTemplate, setFramework, setTemplate]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    analyzeWithDebounce(input);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input, analyzeWithDebounce]);

  // Clear error when user starts typing (separate effect — must not react to error being set)
  useEffect(() => {
    if (input && error) setError(null);
  }, [input]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setProcessing(true);
    setError(null);
    try {
      const result = await generatePrompt({
        input,
        framework: selectedFramework,
        template: selectedTemplate || undefined,
      });
      setOutput(result);

      // Auto-save to history
      insertHistory({
        id: crypto.randomUUID(),
        rawInput: input,
        structuredOutput: result.raw,
        framework: selectedFramework,
        template: selectedTemplate || undefined,
        createdAt: new Date().toISOString(),
      }).catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'Generation failed');
      showToast(err?.message || 'Generation failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleTranscript = (text: string) => {
    const currentInput = usePromptStore.getState().input;
    const separator = currentInput && !currentInput.endsWith(' ') ? ' ' : '';
    setInput(currentInput + separator + text);
    showToast('Speech transcribed');
  };

  return (
    <div className="space-y-2">
      {/* Active template badge */}
      {currentTemplate && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 sub-card">
          <Sparkles className="w-3 h-3 text-[#4A7FA0] shrink-0" />
          <span className="text-xs text-white/60 truncate">{currentTemplate.name}</span>
          <button onClick={() => setTemplate(null)}
            className="ml-auto text-xs text-white/30 hover:text-white/60 transition-colors px-1.5 py-0.5 rounded hover:bg-white/[0.06]">
            &times;
          </button>
        </div>
      )}

      {/* Framework indicator */}
      {currentFramework && (
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4A7FA0]/60" />
          <span className="text-[11px] text-white/40">
            Framework: <span className="text-[#4A7FA0] font-medium">{currentFramework.name}</span>
          </span>
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={3}
        maxLength={5000}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5
                   text-sm text-white/85 placeholder-white/25 resize-none
                   focus:outline-none focus:border-[#4A7FA0]/40 focus:bg-white/[0.06]
                   transition-all duration-200 leading-relaxed"
      />

      {/* Error — more prominent visibility */}
      {error && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-red-500/15 border border-red-500/30 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-0.5" />
          <span className="text-xs text-red-300 leading-relaxed">{error}</span>
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MicButton onTranscript={handleTranscript} disabled={isProcessing} />
          <span className="text-[11px] text-white/25 font-mono">{input.length}/5000</span>
        </div>
        <button onClick={handleGenerate}
          disabled={!input.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#2D4A7A] to-[#3A5A8A]
                     hover:from-[#345585] hover:to-[#4A6A9A]
                     disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:from-[#2D4A7A] disabled:hover:to-[#3A5A8A]
                     text-white text-xs font-medium rounded-md transition-all duration-200
                     shadow-sm shadow-[#2D4A7A]/20 active:scale-[0.97]">
          <Send className="w-3.5 h-3.5" />
          Generate Prompt
        </button>
      </div>
    </div>
  );
}
