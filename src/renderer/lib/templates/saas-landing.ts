import type { Template } from '@/shared/types';

export const saasLandingTemplate: Template = {
  id: 'saas-landing',
  name: 'SaaS Landing Page',
  description: 'Prompt for generating high-converting SaaS landing page copy',
  icon: 'Globe',
  domain: 'saas',
  audienceHint: 'B2B decision-makers',
  framework: 'openai',
  defaultInput:
    'Create a SaaS landing page for a project management tool called TaskFlow. Target audience is remote engineering teams. Key features: AI sprint planning, real-time collaboration, automated reporting.',
};
