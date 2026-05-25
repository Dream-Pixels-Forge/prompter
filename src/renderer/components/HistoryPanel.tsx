import { clearHistory, deleteHistory, listHistory, searchHistory } from '@/renderer/lib/llm';
import { useAppStore } from '@/renderer/stores/app-store';
import { usePromptStore } from '@/renderer/stores/prompt-store';
import type { HistoryEntry } from '@/shared/types';
import { ChevronLeft, Clock, FileText, MessageSquare, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { FrameworkBadge } from './FrameworkBadge';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString();
}

export function HistoryPanel() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const { setInput, setFramework, setTemplate } = usePromptStore();
  const { setActiveTab } = useAppStore();
  const load = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      if (q?.trim()) {
        const data = await searchHistory(q.trim());
        setEntries(data);
      } else {
        const data = await listHistory(50, 0);
        setEntries(data);
      }
    } catch (err) {
      console.warn('[HistoryPanel] Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => load(query), 300);
    return () => clearTimeout(timer);
  }, [query, load]);

  const handleSearch = () => load(query);

  const handleDelete = async (id: string) => {
    await deleteHistory(id);
    load(query);
  };

  const handleClear = async () => {
    await clearHistory();
    load();
  };

  const handleReuse = (entry: HistoryEntry) => {
    setInput(entry.rawInput);
    setFramework(entry.framework);
    if (entry.template) setTemplate(entry.template);
    setActiveTab('compose');
  };

  // Detail view
  if (selected) {
    return (
      <div className="space-y-3.5">
        <button type="button"
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-xs text-white/48 hover:text-white/72 transition-colors group"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to history</span>
        </button>

        {/* Input block */}
        <div className="sub-card p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-white/48">
            <MessageSquare className="w-3 h-3" />
            <span className="text-[10px] uppercase tracking-wider font-medium">Input</span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed line-clamp-6">{selected.rawInput}</p>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2">
          <FrameworkBadge framework={selected.framework} />
          {selected.template && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-white/48">{selected.template}</span>
          )}
          <span className="text-[10px] text-white/48">{formatDate(selected.createdAt)}</span>
        </div>

        {/* Output block */}
        <div className="sub-card p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-white/48">
            <FileText className="w-3 h-3" />
            <span className="text-[10px] uppercase tracking-wider font-medium">Structured Output</span>
          </div>
          <pre className="text-xs text-white/68 leading-relaxed whitespace-pre-wrap font-sans line-clamp-[15]">
            {selected.structuredOutput}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button type="button"
            onClick={() => handleReuse(selected)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium rounded-md transition-colors active:scale-[0.97]"
          >
            <RotateCcw className="w-3 h-3" /> Reuse
          </button>
          <button type="button"
            onClick={() => {
              handleDelete(selected.id);
              setSelected(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 sub-card hover:bg-error/15 hover:border-error/20 text-white/68 hover:text-error text-xs rounded-md transition-all ml-auto"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-2">
      {/* Search bar */}
      <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-1.5 border border-white/[0.06] focus-within:border-accent/30 transition-colors">
        <Search className="w-3.5 h-3.5 text-white/48 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search history..."
          className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/48 outline-none"
        />
        {query && (
          <button type="button"
            onClick={() => {
              setQuery('');
              load();
            }}
            className="text-[11px] text-white/48 hover:text-white/68 transition-colors shrink-0"
          >
            Clear
          </button>
        )}
      </div>

      {/* Count + clear */}
      {entries.length > 0 && (
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[11px] text-white/48">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </span>
          <button type="button" onClick={handleClear} className="text-[11px] text-error/50 hover:text-error transition-colors">
            Clear all
          </button>
        </div>
      )}

      {/* List */}
      <div className="space-y-1 flex-1 overflow-y-auto min-h-0 pr-0.5">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-white/48 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-white/35" />
            </div>
            <p className="text-xs text-white/48">{query ? 'No matches found' : 'No history yet'}</p>
            <p className="text-[11px] text-white/48 mt-1">
              {query ? 'Try a different search term' : 'Generated prompts appear here'}
            </p>
          </div>
        ) : (
          entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="group flex items-start gap-2.5 p-2.5 rounded-lg sub-card cursor-pointer text-left w-full"
              onClick={() => setSelected(entry)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate leading-snug mb-1">{entry.rawInput}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <FrameworkBadge framework={entry.framework} />
                  {entry.template && <span className="text-[10px] text-white/48">{entry.template}</span>}
                  <span className="text-[10px] text-white/48 ml-auto">{formatDate(entry.createdAt)}</span>
                </div>
              </div>
              <button type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(entry.id);
                }}
                aria-label="Delete entry"
                className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-error/15 transition-all shrink-0 mt-0.5"
              >
                <Trash2 className="w-3 h-3 text-white/68 hover:text-error" />
              </button>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
