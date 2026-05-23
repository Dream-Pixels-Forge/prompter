import { create } from 'zustand';
import { type GenerateResponse } from '@/shared/types';
import { frameworks } from '@/renderer/lib/frameworks';
import { templates } from '@/renderer/lib/templates';

interface PromptStore {
  input: string;
  output: GenerateResponse | null;
  selectedFramework: string;
  selectedTemplate: string | null;
  history: string[];

  setInput: (input: string) => void;
  setOutput: (output: GenerateResponse | null) => void;
  setFramework: (id: string) => void;
  setTemplate: (id: string | null) => void;
  addToHistory: (entry: string) => void;
  clearOutput: () => void;
}

export const usePromptStore = create<PromptStore>((set) => ({
  input: '',
  output: null,
  selectedFramework: frameworks[0]?.id || 'openai',
  selectedTemplate: null,
  history: [],

  setInput: (input) => set({ input }),
  setOutput: (output) => set({ output }),
  setFramework: (id) => set({ selectedFramework: id }),
  setTemplate: (id) => set({ selectedTemplate: id }),
  addToHistory: (entry) => set((state) => ({ history: [entry, ...state.history].slice(0, 50) })),
  clearOutput: () => set({ output: null }),
}));
