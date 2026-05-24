import { anthropicFramework } from './frameworks/anthropic';
import { contextEngFramework } from './frameworks/context-eng';
import { karpathyFramework } from './frameworks/karpathy';
import { mplctFramework } from './frameworks/mplct';
import { openaiFramework } from './frameworks/openai';
import type { Framework } from './types';

export const frameworks: Framework[] = [
  openaiFramework,
  anthropicFramework,
  karpathyFramework,
  mplctFramework,
  contextEngFramework,
];

export function getFramework(id: string): Framework | undefined {
  return frameworks.find((f) => f.id === id);
}

export function detectFramework(input: string): string {
  const lower = input.toLowerCase();
  if (/(video|film|animation|3d|motion|cinematic)/.test(lower)) return 'mplct';
  if (/(agent|assistant|tool|function|autonomous)/.test(lower)) return 'karpathy';
  if (/(support|ticket|helpdesk|customer)/.test(lower)) return 'anthropic';
  if (/(context|memory|knowledge|sop|retrieval)/.test(lower)) return 'context-eng';
  return 'openai';
}
