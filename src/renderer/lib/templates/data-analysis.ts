import type { Template } from '@/shared/types';

export const dataAnalysisTemplate: Template = {
  id: 'data-analysis',
  name: 'Data Analysis / Report',
  description: 'Structured prompt for data analysis, insights extraction, and report generation',
  icon: 'BarChart3',
  domain: 'business',
  audienceHint: 'Data analysts, product managers, researchers',
  framework: 'openai',
  defaultInput:
    'Analyze this e-commerce sales data and generate an executive summary. Include revenue trends, top-performing categories, customer segment breakdown, and actionable recommendations. Support all claims with specific data points.',
};
