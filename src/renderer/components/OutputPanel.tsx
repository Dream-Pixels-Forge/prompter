import { Copy, Check, RotateCcw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { usePromptStore } from '@/renderer/stores/prompt-store';
import { useAppStore } from '@/renderer/stores/app-store';
import { getFramework } from '@/renderer/lib/frameworks';
import { copyText } from '@/renderer/lib/clipboard';
import { PromptSection } from './PromptSection';
import { FrameworkBadge } from './FrameworkBadge';

export function OutputPanel() {
  const { output, clearOutput } = usePromptStore();
  const showToast = useAppStore((s) => s.showToast);
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  if (!output) return null;

  const framework = getFramework(output.framework);

  useEffect(() => {
    return () => { if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current); };
  }, []);

  const handleCopy = async () => {
    const success = await copyText(output.raw);
    if (success) {
      setCopied(true);
      showToast('Copied to clipboard');
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Structured Prompt</span>
          {framework && <FrameworkBadge framework={output.framework} />}
        </div>
        <div className="flex gap-0.5">
          <button onClick={handleCopy} aria-label={copied ? 'Copied' : 'Copy to clipboard'}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors group">
            {copied
              ? <Check className="w-3.5 h-3.5 text-green-400" />
              : <Copy className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70" />
            }
          </button>
          <button onClick={clearOutput} aria-label="Clear output"
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors group">
            <RotateCcw className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70" />
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {framework?.sections.map(section => (
          <PromptSection
            key={section.key}
            label={section.label}
            content={output.sections[section.key] || ''}
          />
        ))}
      </div>
    </div>
  );
}
