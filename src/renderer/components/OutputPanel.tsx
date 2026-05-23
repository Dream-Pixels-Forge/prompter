import { Copy, Check, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { usePromptStore } from '@/renderer/stores/prompt-store';
import { useAppStore } from '@/renderer/stores/app-store';
import { getFramework } from '@/renderer/lib/frameworks';
import { copyText } from '@/renderer/lib/clipboard';
import { PromptSection } from './PromptSection';

export function OutputPanel() {
  const { output, clearOutput } = usePromptStore();
  const { showToast } = useAppStore();
  const [copied, setCopied] = useState(false);

  if (!output) return null;

  const framework = getFramework(output.framework);

  const handleCopy = async () => {
    const success = await copyText(output.raw);
    if (success) {
      setCopied(true);
      showToast('Copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white/60">Structured Prompt</span>
          {framework && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2D4A7A]/20 text-[#4A7FA0]">
              {framework.name}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={handleCopy}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
          </button>
          <button onClick={clearOutput}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
            <RotateCcw className="w-3.5 h-3.5 text-white/60" />
          </button>
        </div>
      </div>

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
