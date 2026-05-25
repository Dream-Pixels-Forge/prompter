import type { Template } from '@/shared/types';

export const productLaunchTemplate: Template = {
  id: 'product-launch',
  name: 'Product Launch Plan',
  description: 'Go-to-market strategy with timeline, channels, and success metrics',
  icon: 'Send',
  domain: 'business',
  audienceHint: 'Product managers and marketing leads',
  framework: 'openai',
  defaultInput:
    'Design a 4-week product launch plan for a developer tool that simplifies MCP server creation. Include pre-launch (teaser campaign, beta tester outreach), launch day (Product Hunt, Hacker News, Twitter/X thread), and post-launch (community engagement, content pipeline, metrics tracking). Define KPIs for each phase.',
};
