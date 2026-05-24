import { frameworks } from '@/renderer/lib/frameworks';
import { templates } from '@/renderer/lib/templates';
import type { GenerateResponse } from '@/shared/types';
import { create } from 'zustand';

interface PromptStore {
  input: string;
  output: GenerateResponse | null;
  selectedFramework: string;
  selectedTemplate: string | null;
  error: string | null;

  setInput: (input: string) => void;
  setOutput: (output: GenerateResponse | null) => void;
  setFramework: (id: string) => void;
  setTemplate: (id: string | null) => void;
  setError: (error: string | null) => void;
  clearOutput: () => void;
}

export const usePromptStore = create<PromptStore>((set) => ({
  input: '',
  output: null,
  selectedFramework: frameworks[0]?.id || 'openai',
  selectedTemplate: null,
  error: null,

  setInput: (input) => set({ input }),
  setOutput: (output) => set({ output, error: null }),
  setFramework: (id) => set({ selectedFramework: id }),
  setTemplate: (id) => set({ selectedTemplate: id }),
  setError: (error) => set({ error }),
  clearOutput: () => set({ output: null, error: null }),
}));
