import { type Framework } from '@/shared/types';
import { openaiFramework } from './openai';
import { anthropicFramework } from './anthropic';
import { karpathyFramework } from './karpathy';
import { mplctFramework } from './mplct';
import { contextEngFramework } from './context-eng';

export const frameworks: Framework[] = [
  openaiFramework,
  anthropicFramework,
  karpathyFramework,
  mplctFramework,
  contextEngFramework,
];

export function getFramework(id: string): Framework | undefined {
  return frameworks.find(f => f.id === id);
}

export function detectFramework(input: string): string {
  const lower = input.toLowerCase();
  if (/(video|film|animation|3d|motion|cinematic)/i.test(lower)) return 'mplct';
  if (/(agent|assistant|tool|function|autonomous)/i.test(lower)) return 'karpathy';
  if (/(support|ticket|helpdesk|customer)/i.test(lower)) return 'anthropic';
  if (/(context|memory|knowledge|sop|retrieval)/i.test(lower)) return 'context-eng';
  return 'openai';
}
