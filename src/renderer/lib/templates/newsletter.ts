import type { Template } from '@/shared/types';

export const newsletterTemplate: Template = {
  id: 'newsletter',
  name: 'Email Newsletter',
  description: 'Professional email newsletters with engaging content and clear CTAs',
  icon: 'MessageSquare',
  domain: 'content',
  audienceHint: 'Newsletter writers and marketing teams',
  framework: 'openai',
  defaultInput:
    'Write a weekly newsletter edition for "AI Tools Weekly" targeting product builders and indie hackers. Feature 3 new AI tools, one practical tutorial, and one opinion piece on the future of agentic workflows. Keep the tone conversational and actionable. Include a sponsor slot.',
};
