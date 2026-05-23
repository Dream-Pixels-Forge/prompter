import { frameworks, detectFramework } from '@/renderer/lib/frameworks';
import { templates } from '@/renderer/lib/templates';
import { type Framework, type Template } from '@/shared/types';

export interface IntentAnalysis {
  framework: Framework;
  template?: Template;
  confidence: number;
}

export function analyzeIntent(input: string): IntentAnalysis {
  const lower = input.toLowerCase();
  const frameworkId = detectFramework(input);
  const framework = frameworks.find(f => f.id === frameworkId) || frameworks[0];

  const matchedTemplate = templates.find(t => {
    const terms = t.domain.toLowerCase().split(/[\s/]+/);
    return terms.some(term => lower.includes(term));
  });

  const wordCount = input.split(/\s+/).length;
  const hasDomain = matchedTemplate !== undefined;
  const confidence = Math.min(
    1.0,
    (wordCount > 5 ? 0.4 : 0.2) +
    (hasDomain ? 0.3 : 0) +
    (input.includes('create') || input.includes('write') || input.includes('generate') ? 0.2 : 0) +
    (input.includes('for') || input.includes('target') ? 0.1 : 0)
  );

  return { framework, template: matchedTemplate, confidence };
}

export function extractKeywords(input: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'can', 'could', 'shall', 'should', 'may', 'might', 'must',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
    'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their',
    'this', 'that', 'these', 'those', 'am', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'between',
    'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'if', 'because',
    'while', 'although', 'since', 'unless', 'until', 'about',
  ]);

  return input
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
}
