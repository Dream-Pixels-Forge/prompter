import { Copy, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { copyText } from '@/renderer/lib/clipboard';

interface Props {
  label: string;
  content: string;
}

export function PromptSection({ label, content }: Props) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleCopy = async () => {
    const success = await copyText(content);
    if (success) {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="sub-card overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border-b border-white/[0.04]">
        <span className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">{label}</span>
        <button onClick={handleCopy}
          className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-white/[0.08] transition-colors group">
          {copied
            ? <Check className="w-3 h-3 text-green-400" />
            : <Copy className="w-3 h-3 text-white/30 group-hover:text-white/60" />
          }
        </button>
      </div>
      {/* Section content */}
      <div className="px-3 py-2.5">
        <p className="text-[13px] text-white/75 leading-[1.7] whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
