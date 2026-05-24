import { getTemplate, templates } from '@/renderer/lib/templates';
import { useAppStore } from '@/renderer/stores/app-store';
import { usePromptStore } from '@/renderer/stores/prompt-store';
import {
  BarChart3,
  BookOpen,
  Bot,
  ChefHat,
  FileText,
  GitPullRequest,
  Headphones,
  type LucideIcon,
  Microscope,
  Palette,
  PenLine,
  Sparkles,
  Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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

const CATEGORIES = [
  { id: 'dev', label: 'Dev', ids: ['api-docs', 'code-review', 'agent-prompt'] },
  { id: 'content', label: 'Content', ids: ['blog-post', 'cooking-book', 'video-gen'] },
  { id: 'business', label: 'Business', ids: ['saas-landing', 'data-analysis', 'prd', 'support-agent'] },
  { id: 'misc', label: 'Misc', ids: ['ux-brief', 'research-paper'] },
];

export function TemplateBrowser() {
  const { setTemplate, setInput, setFramework } = usePromptStore();
  const { setActiveTab } = useAppStore();
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);

  const handleSelect = (id: string) => {
    const tpl = getTemplate(id);
    if (tpl) {
      setTemplate(id);
      setInput(tpl.defaultInput);
      setFramework(tpl.framework);
      setActiveTab('compose');
    }
  };

  useEffect(() => {
    if (import.meta.env.DEV) {
      templates.forEach((tpl) => {
        if (!iconMap[tpl.icon] && tpl.icon !== 'Sparkles') {
          console.warn(`[TemplateBrowser] No icon mapping for "${tpl.icon}" — using Sparkles fallback`);
        }
      });
    }
  }, []);

  const cat = CATEGORIES.find((c) => c.id === activeCategory)!;
  const visible = templates.filter((t) => cat.ids.includes(t.id));

  return (
    <div className="space-y-2">
      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.04] rounded-lg p-0.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`flex-1 text-[10px] font-medium py-1.5 rounded-md transition-colors ${
              c.id === activeCategory ? 'bg-brand-500/20 text-white/90' : 'text-white/48 hover:text-white/72'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-1.5 auto-rows-fr">
        {visible.map((tpl) => (
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
