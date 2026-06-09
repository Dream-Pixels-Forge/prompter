import { copyText } from '@/renderer/lib/clipboard';
import { getFramework } from '@/renderer/lib/frameworks';
import { useAppStore } from '@/renderer/stores/app-store';
import { usePromptStore } from '@/renderer/stores/prompt-store';
import { AlertTriangle, Check, Copy, PenLine, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FrameworkBadge } from './FrameworkBadge';
import { PromptSection } from './PromptSection';

export function OutputPanel() {
  const { output, clearOutput } = usePromptStore();
  const showToast = useAppStore((s) => s.showToast);
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  if (!output) return null;

  const framework = getFramework(output.framework);

  const isFallback = output.fallbackUsed === true;

  const handleCopy = async () => {
    if (!framework || isFallback) return;
    const combinedText = framework.sections.map((s) => `### ${s.label}\n${output.sections[s.key] || ''}`).join('\n\n');
    const success = await copyText(combinedText);
    if (success) {
      setCopied(true);
      showToast('Copied to clipboard');
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } else {
      showToast('Copy failed — please try again');
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Back to input */}
      <button
        type="button"
        onClick={clearOutput}
        aria-label="Back to input"
        className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors group"
      >
        <PenLine className="w-3 h-3" />
        <span className="font-medium">New Prompt</span>
      </button>

      {/* Fallback warning banner */}
      {isFallback && (
        <div
          role="alert"
          className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/15 border border-amber-500/30 rounded-lg"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-amber-300">LLM unavailable — template fallback used</p>
            <p className="text-[11px] text-amber-400/70 mt-0.5 leading-relaxed">
              {output.fallbackReason || 'The LLM provider was unreachable. Output below is a local template, not AI-generated.'}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-white/72 uppercase tracking-wider">Structured Prompt</span>
          {framework && <FrameworkBadge framework={output.framework} />}
        </div>
        <div className="flex gap-0.5">
          <button
            type="button"
            onClick={handleCopy}
            disabled={isFallback}
            aria-label={isFallback ? 'Copy disabled — fallback output' : copied ? 'Copied' : 'Copy to clipboard'}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors group disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-white/48 group-hover:text-white/72" />
            )}
          </button>
          <button
            type="button"
            onClick={clearOutput}
            aria-label="Clear output"
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors group"
          >
            <RotateCcw className="w-3.5 h-3.5 text-white/48 group-hover:text-white/72" />
          </button>
        </div>
      </div>

      {/* Sections — dimmed when fallback */}
      <div className={`space-y-2 ${isFallback ? 'opacity-60' : ''}`}>
        {framework?.sections.map((section) => (
          <PromptSection key={section.key} label={section.label} content={output.sections[section.key] || ''} />
        ))}
      </div>
    </div>
  );
}
