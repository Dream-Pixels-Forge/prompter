import { Sparkles, ChefHat, BookOpen, type LucideIcon } from 'lucide-react';
import { usePromptStore } from '@/renderer/stores/prompt-store';
import { useAppStore } from '@/renderer/stores/app-store';
import { templates } from '@/renderer/lib/templates';
import { TemplateCard } from './TemplateCard';

const iconMap: Record<string, LucideIcon> = {
  Globe: Sparkles,
  ChefHat,
  BookOpen,
};

export function TemplateBrowser() {
  const { setTemplate, setInput } = usePromptStore();
  const { setActiveTab } = useAppStore();

  const handleSelect = (id: string) => {
    const tpl = templates.find(t => t.id === id);
    if (tpl) {
      setTemplate(id);
      setInput(tpl.defaultInput);
      setActiveTab('compose');
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/40">Choose a template to get started</p>
      <div className="grid grid-cols-1 gap-2">
        {templates.map(tpl => (
          <TemplateCard
            key={tpl.id}
            template={tpl}
            icon={iconMap[tpl.icon] || Sparkles}
            onSelect={() => handleSelect(tpl.id)}
          />
        ))}
      </div>
    </div>
  );
}
