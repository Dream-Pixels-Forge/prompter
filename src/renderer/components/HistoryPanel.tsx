import { useState, useEffect, useCallback } from 'react';
import { Clock, Search, Trash2, ChevronLeft, RotateCcw } from 'lucide-react';
import { type HistoryEntry } from '@/shared/types';
import { listHistory, searchHistory, deleteHistory, clearHistory } from '@/renderer/lib/llm';
import { usePromptStore } from '@/renderer/stores/prompt-store';
import { useAppStore } from '@/renderer/stores/app-store';

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
      if (q && q.trim()) {
        setEntries(await searchHistory(q.trim()));
      } else {
        setEntries(await listHistory(50, 0));
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
      <div className="space-y-3">
        <button onClick={() => setSelected(null)}
          className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors">
          <ChevronLeft className="w-3 h-3" /> Back
        </button>

        <div className="bg-white/[0.04] rounded-xl p-3 space-y-2">
          <p className="text-xs text-white/30 uppercase tracking-wide">Input</p>
          <p className="text-sm text-white/80 leading-relaxed line-clamp-6">{selected.rawInput}</p>
        </div>

        <div className="flex gap-2 text-xs text-white/40">
          <span className="bg-white/[0.06] px-2 py-1 rounded">{selected.framework}</span>
          {selected.template && (
            <span className="bg-white/[0.06] px-2 py-1 rounded">{selected.template}</span>
          )}
          <span className="ml-auto">{formatDate(selected.createdAt)}</span>
        </div>

        <div className="bg-white/[0.04] rounded-xl p-3 space-y-2">
          <p className="text-xs text-white/30 uppercase tracking-wide">Structured Output</p>
          <pre className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap font-sans line-clamp-[15]">
            {selected.structuredOutput}
          </pre>
        </div>

        <div className="flex gap-2">
          <button onClick={() => handleReuse(selected)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2D4A7A] hover:bg-[#3A5A8A] text-white text-xs rounded-lg transition-colors">
            <RotateCcw className="w-3 h-3" /> Reuse
          </button>
          <button onClick={() => { handleDelete(selected.id); setSelected(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] hover:bg-red-500/20 text-white/60 hover:text-red-400 text-xs rounded-lg transition-colors ml-auto">
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-1.5">
        <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search history..."
          className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/30 outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(''); load(); }}
            className="text-xs text-white/30 hover:text-white/60">Clear</button>
        )}
      </div>

      {/* Actions */}
      {entries.length > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/30">{entries.length} entries</span>
          <button onClick={handleClear}
            className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Clear all</button>
        </div>
      )}

      {/* List */}
      <div className="space-y-1.5 max-h-[340px] overflow-y-auto">
        {loading ? (
          <p className="text-center text-xs text-white/30 py-8">Loading...</p>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 text-white/[0.08] mx-auto mb-2" />
            <p className="text-xs text-white/30">
              {query ? 'No matches found' : 'No history yet'}
            </p>
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id}
              className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer"
              onClick={() => setSelected(entry)}>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">{entry.rawInput}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[#4A7FA0]/80 px-1.5 py-0.5 bg-[#4A7FA0]/10 rounded">
                    {entry.framework}
                  </span>
                  <span className="text-[10px] text-white/30">{formatDate(entry.createdAt)}</span>
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); handleDelete(entry.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                title="Delete">
                <Trash2 className="w-3 h-3 text-white/30 hover:text-red-400" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
