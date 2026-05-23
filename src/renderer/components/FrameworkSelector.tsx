import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { usePromptStore } from '@/renderer/stores/prompt-store';
import { frameworks } from '@/renderer/lib/frameworks';
import { getFramework } from '@/renderer/lib/frameworks';

export function FrameworkSelector() {
  const { selectedFramework, setFramework } = usePromptStore();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = getFramework(selectedFramework);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] transition-colors text-xs text-white/60">
        {current?.name || 'Framework'}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-[#1C1917] border border-white/[0.08] rounded-lg shadow-xl overflow-hidden z-50">
          {frameworks.map(fw => (
            <button key={fw.id}
              onClick={() => { setFramework(fw.id); setIsOpen(false); }}
              className={`w-full px-3 py-2 text-left text-xs transition-colors ${
                fw.id === selectedFramework ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}>
              <div className="font-medium">{fw.name}</div>
              <div className="text-[10px] text-white/40 mt-0.5">{fw.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
