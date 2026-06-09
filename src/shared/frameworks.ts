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
  if (/\b(video|film|animation|3d|motion|cinematic)\b/.test(lower)) return 'mplct';
  if (/\b(agent|assistant|tool|function|autonomous)\b/.test(lower)) return 'karpathy';
  if (/\b(support|ticket|helpdesk|customer)\b/.test(lower)) return 'anthropic';
  if (/\b(context|memory|knowledge|sop|retrieval)\b/.test(lower)) return 'context-eng';
  return 'openai';
}
