import { Copy } from 'lucide-react';
import { useState } from 'react';
import { copyText } from '@/renderer/lib/clipboard';

interface Props {
  label: string;
  content: string;
}

export function PromptSection({ label, content }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyText(content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border-b border-white/[0.04]">
        <span className="text-xs font-medium text-white/70">{label}</span>
        <button onClick={handleCopy}
          className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors">
          <Copy className="w-3 h-3 text-white/40" />
        </button>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
