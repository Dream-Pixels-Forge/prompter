import { copyText } from '@/renderer/lib/clipboard';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  label: string;
  content: string;
}

export function PromptSection({ label, content }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
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
      <div
        className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border-b border-white/[0.04] cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setCollapsed(!collapsed);
        }}
      >
        <div className="flex items-center gap-1.5">
          <ChevronDown
            className={`w-3 h-3 text-white/48 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
          />
          <span className="text-[11px] font-semibold text-white/68 uppercase tracking-wider">{label}</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-white/[0.08] transition-colors group"
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-400" />
          ) : (
            <Copy className="w-3 h-3 text-white/48 group-hover:text-white/72" />
          )}
        </button>
      </div>
      {/* Section content */}
      {!collapsed && (
        <div className="px-3 py-2.5">
          <p className="text-[13px] text-white/80 leading-[1.7] whitespace-pre-wrap">{content}</p>
        </div>
      )}
    </div>
  );
}
