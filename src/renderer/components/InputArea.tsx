import { useState, useRef, useEffect } from 'react';
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

  const currentTemplate = selectedTemplate ? getTemplate(selectedTemplate) : undefined;
  const currentFramework = getFramework(selectedFramework);

  const placeholder = currentTemplate?.defaultInput || 'Describe what you want to create...';

  useEffect(() => {
    if (input.length > 10) {
      const analysis = analyzeIntent(input);
      setFramework(analysis.framework.id);
      if (analysis.template && !selectedTemplate) {
        setTemplate(analysis.template.id);
      }
    }
    if (error) setError(null);
  }, [input]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
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
    <div className="space-y-3">
      {currentTemplate && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] rounded-lg">
          <Sparkles className="w-3 h-3 text-[#4A7FA0]" />
          <span className="text-xs text-white/60">{currentTemplate.name}</span>
          <button onClick={() => setTemplate(null)}
            className="ml-auto text-xs text-white/30 hover:text-white/60">&times;</button>
        </div>
      )}

      {currentFramework && (
        <div className="text-xs text-white/40 px-1">
          Framework: <span className="text-[#4A7FA0]">{currentFramework.name}</span>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={3}
        maxLength={5000}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3
                   text-sm text-white/90 placeholder-white/30 resize-none
                   focus:outline-none focus:border-[#4A7FA0]/40 focus:bg-white/[0.06]
                   transition-colors duration-200"
      />

      {error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <span className="text-xs text-red-400/90 leading-relaxed">{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MicButton onTranscript={handleTranscript} disabled={isProcessing} />
          <span className="text-xs text-white/30">{input.length}/5000</span>
        </div>
        <button onClick={handleGenerate}
          disabled={!input.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-[#2D4A7A] hover:bg-[#3A5A8A]
                     disabled:opacity-40 disabled:cursor-not-allowed
                     text-white text-sm rounded-lg transition-colors duration-200">
          <Send className="w-3.5 h-3.5" />
          Generate Prompt
        </button>
      </div>
    </div>
  );
}
