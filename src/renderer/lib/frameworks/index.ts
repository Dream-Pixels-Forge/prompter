import { type Framework } from '@/shared/types';
import { openaiFramework } from './openai';
import { anthropicFramework } from './anthropic';
import { karpathyFramework } from './karpathy';

export const frameworks: Framework[] = [
  openaiFramework,
  anthropicFramework,
  karpathyFramework,
];

export function getFramework(id: string): Framework | undefined {
  return frameworks.find(f => f.id === id);
}

export function detectFramework(input: string): string {
  const lower = input.toLowerCase();
  // Detect based on keywords
  if (/(video|film|animation|3d|motion)/i.test(lower)) return 'mplct';
  if (/(agent|assistant|tool|function|autonomous)/i.test(lower)) return 'karpathy';
  if (/(support|ticket|helpdesk|customer)/i.test(lower)) return 'anthropic';
  if (/(context|memory|knowledge|sop)/i.test(lower)) return 'context-eng';
  return 'openai'; // default
}
