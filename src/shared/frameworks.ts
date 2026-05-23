import { type Framework } from './types';
import { openaiFramework } from '../renderer/lib/frameworks/openai';
import { anthropicFramework } from '../renderer/lib/frameworks/anthropic';
import { karpathyFramework } from '../renderer/lib/frameworks/karpathy';
import { mplctFramework } from '../renderer/lib/frameworks/mplct';
import { contextEngFramework } from '../renderer/lib/frameworks/context-eng';

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
