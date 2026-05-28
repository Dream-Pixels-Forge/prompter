import type { Template } from '@/shared/types';
import type { LucideIcon } from 'lucide-react';
import { Sparkles } from 'lucide-react';

interface Props {
  template: Template;
  icon: LucideIcon;
  onSelect: () => void;
}

export function TemplateCard({ template, icon: Icon, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Select template: ${template.name}`}
      className="flex flex-col gap-1.5 p-2.5 sub-card hover:border-accent/30 cursor-pointer
                 transition-all duration-200 text-left group h-full"
    >
      {/* Icon row */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-md bg-brand-500/20 flex items-center justify-center shrink-0
                        group-hover:bg-brand-500/30 transition-colors"
        >
          <Icon className="w-3.5 h-3.5 text-accent" />
        </div>
        <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors truncate">
          {template.name}
        </span>
      </div>
      {/* Description */}
      <p className="text-[11px] text-white/48 leading-relaxed line-clamp-2">{template.description}</p>
      {/* Meta */}
      <div className="flex items-center gap-1.5 mt-auto pt-1">
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.05] text-white/48 uppercase tracking-wider">
          {template.domain}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent/70">{template.framework}</span>
      </div>
    </button>
  );
}
