import { PROVIDER_DEFINITIONS } from '@/shared/provider-definitions';
import type { ProviderCategory } from '@/shared/providers';
import type { AppSettings } from '@/shared/types';
import { ChevronDown, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ProviderSwitcherProps {
  open: boolean;
  onClose: () => void;
  onSelect: (providerId: string) => void;
  activeProvider: string;
  configuredProviders: Set<string>;
  providerConfigs: AppSettings['providerConfigs'];
}

const CATEGORY_LABELS: Record<ProviderCategory, { label: string; icon: string }> = {
  cloud: { label: 'Cloud', icon: '☁' },
  local: { label: 'Local', icon: '🖥' },
  router: { label: 'Router', icon: '🔀' },
};

const CATEGORY_ORDER: ProviderCategory[] = ['cloud', 'local', 'router'];

export function ProviderSwitcher({
  open,
  onClose,
  onSelect,
  activeProvider,
  configuredProviders,
  providerConfigs,
}: ProviderSwitcherProps) {
  const [query, setQuery] = useState('');
  const [focusIdx, setFocusIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter by search query
  const filtered = PROVIDER_DEFINITIONS.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.models.some((m) => m.toLowerCase().includes(q))
    );
  });

  // Group by category
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    providers: filtered.filter((p) => p.category === cat),
  })).filter((g) => g.providers.length > 0);

  const flatItems = grouped.flatMap((g) => g.providers);

  useEffect(() => {
    if (open) {
      setQuery('');
      setFocusIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusIdx((i) => Math.min(i + 1, flatItems.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const item = flatItems[focusIdx];
        if (item) {
          onSelect(item.id);
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, focusIdx, flatItems, onSelect, onClose]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-xl overflow-hidden z-50 max-h-80 flex flex-col"
    >
      {/* Search input */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <Search className="w-3.5 h-3.5 text-white/48 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setFocusIdx(0);
          }}
          placeholder="Search providers..."
          aria-label="Search providers"
          className="bg-transparent text-xs text-white/80 outline-none w-full placeholder:text-white/30"
        />
      </div>

      {/* Provider list */}
      <div className="overflow-y-auto flex-1">
        {grouped.length === 0 && (
          <p className="text-[11px] text-white/48 text-center py-4">No providers match &quot;{query}&quot;</p>
        )}
        {grouped.map((group) => (
          <div key={group.category}>
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-white/38 uppercase tracking-wider">
              <span>{group.label.icon}</span>
              <span>{group.label.label}</span>
            </div>
            {group.providers.map((def) => {
              const isActive = def.id === activeProvider;
              const isConfigured = configuredProviders.has(def.id);
              const idx = flatItems.indexOf(def);
              const isFocused = idx === focusIdx;
              const currentCfg = providerConfigs[def.id];

              return (
                <button
                  key={def.id}
                  type="button"
                  onClick={() => {
                    onSelect(def.id);
                    onClose();
                  }}
                  onMouseEnter={() => setFocusIdx(idx)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    isFocused ? 'bg-white/[0.06]' : ''
                  } ${isActive ? 'text-white' : 'text-white/68 hover:text-white'}`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isActive ? 'border-accent' : 'border-white/15'
                    }`}
                  >
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium">
                      {def.name}
                      {isConfigured && <span className="ml-1.5 text-[9px] text-green-400">✓</span>}
                    </div>
                    <div className="text-[10px] text-white/48 truncate">
                      {currentCfg?.model ?? def.defaultModel} — {def.description}
                    </div>
                  </div>
                  {isActive && (
                    <span className="text-[9px] text-accent/60 uppercase tracking-wider shrink-0">Active</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
