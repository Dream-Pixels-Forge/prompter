import type { Template } from '@/shared/types';

export const competitorAnalysisTemplate: Template = {
  id: 'competitor-analysis',
  name: 'Competitor Analysis',
  description: 'Competitive intelligence reports with strategic positioning recommendations',
  icon: 'Target',
  domain: 'business',
  audienceHint: 'Product managers, strategists, and founders',
  framework: 'openai',
  defaultInput:
    'Analyze the competitive landscape for AI code generation tools. Compare GitHub Copilot, Cursor, Codeium, Amazon CodeWhisperer, and open-source alternatives. Evaluate on: code quality, IDE integration, pricing, team features, enterprise readiness, and unique differentiators. Provide a strategic positioning recommendation.',
};
