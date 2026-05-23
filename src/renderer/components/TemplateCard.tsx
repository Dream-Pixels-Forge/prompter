import { type Template } from '@/shared/types';
import { type LucideIcon, Sparkles } from 'lucide-react';

interface Props {
  template: Template;
  icon: LucideIcon;
  onSelect: () => void;
}

export function TemplateCard({ template, icon: Icon, onSelect }: Props) {
  return (
    <button onClick={onSelect}
      className="w-full flex items-start gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06]
                 border border-white/[0.06] hover:border-[#4A7FA0]/30 rounded-xl
                 transition-all duration-200 text-left group">
      <div className="w-8 h-8 rounded-lg bg-[#2D4A7A]/20 flex items-center justify-center flex-shrink-0
                      group-hover:bg-[#2D4A7A]/30 transition-colors">
        <Icon className="w-4 h-4 text-[#4A7FA0]" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
          {template.name}
        </div>
        <div className="text-xs text-white/40 mt-0.5 line-clamp-2">{template.description}</div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-white/30">{template.domain}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/40">{template.framework}</span>
        </div>
      </div>
    </button>
  );
}
