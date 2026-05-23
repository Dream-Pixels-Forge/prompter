import { Sparkles, ChefHat, BookOpen, Bot, GitPullRequest, Video, PenLine, Headphones, BarChart3, Palette, FileText, Microscope, type LucideIcon } from 'lucide-react';
import { usePromptStore } from '@/renderer/stores/prompt-store';
import { useAppStore } from '@/renderer/stores/app-store';
import { templates, getTemplate } from '@/renderer/lib/templates';
import { TemplateCard } from './TemplateCard';

const iconMap: Record<string, LucideIcon> = {
  Globe: Sparkles,
  ChefHat,
  BookOpen,
  Bot,
  GitPullRequest,
  Video,
  PenLine,
  Headphones,
  BarChart3,
  Palette,
  FileText,
  Microscope,
};

export function TemplateBrowser() {
  const { setTemplate, setInput, setFramework } = usePromptStore();
  const { setActiveTab } = useAppStore();

  const handleSelect = (id: string) => {
    const tpl = getTemplate(id);
    if (tpl) {
      setTemplate(id);
      setInput(tpl.defaultInput);
      setFramework(tpl.framework);
      setActiveTab('compose');
    }
  };

  // Dev warning for missing icon mappings
  if (process.env.NODE_ENV === 'development') {
    templates.forEach(tpl => {
      if (!iconMap[tpl.icon] && tpl.icon !== 'Sparkles') {
        console.warn(`[TemplateBrowser] No icon mapping for "${tpl.icon}" — using Sparkles fallback`);
      }
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/35">Choose a template to get started</p>
      <div className="grid grid-cols-2 gap-2 auto-rows-fr">
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
