import { Copy, Check, RotateCcw } from 'lucide-react';
import { useState } from 'react';
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

  if (!output) return null;

  const framework = getFramework(output.framework);

  const handleCopy = async () => {
    const success = await copyText(output.raw);
    if (success) {
      setCopied(true);
      showToast('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Structured Prompt</span>
          {framework && <FrameworkBadge framework={output.framework} />}
        </div>
        <div className="flex gap-1">
          <button onClick={handleCopy}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors group">
            {copied
              ? <Check className="w-3.5 h-3.5 text-green-400" />
              : <Copy className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70" />
            }
          </button>
          <button onClick={clearOutput}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors group">
            <RotateCcw className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70" />
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-2.5">
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
