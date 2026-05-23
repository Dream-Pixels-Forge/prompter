import { getFramework } from '@/renderer/lib/frameworks';

const COLOR_MAP: Record<string, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/15',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/15',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/15',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/15',
  violet: 'bg-violet-500/10 text-violet-400 border-violet-500/15',
};

export function FrameworkBadge({ framework }: { framework: string }) {
  const fw = getFramework(framework);
  const colorClass = COLOR_MAP[fw?.color || ''] || 'bg-white/[0.06] text-white/50 border-white/[0.08]';

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>
      {fw?.name || framework}
    </span>
  );
}
