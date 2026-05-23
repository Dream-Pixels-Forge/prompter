import { usePromptStore } from '@/renderer/stores/prompt-store';
import { getFramework } from '@/renderer/lib/frameworks';

export function FrameworkBadge() {
  const { selectedFramework } = usePromptStore();
  const framework = getFramework(selectedFramework);

  if (!framework) return null;

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#2D4A7A]/15 border border-[#4A7FA0]/20">
      <span className="w-1.5 h-1.5 rounded-full bg-[#4A7FA0]" />
      <span className="text-[10px] text-[#4A7FA0] font-medium">{framework.name}</span>
    </span>
  );
}
