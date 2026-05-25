import type { Template } from '@/shared/types';

export const emailCampaignTemplate: Template = {
  id: 'email-campaign',
  name: 'Email Campaign',
  description: 'Multi-step email sequences with compelling copy and conversion focus',
  icon: 'Send',
  domain: 'business',
  audienceHint: 'Marketing teams and growth specialists',
  framework: 'openai',
  defaultInput:
    'Create a 5-email drip campaign for a SaaS project management tool trial users. Emails: welcome/onboarding, feature deep-dive (AI sprint planning), social proof (customer case study), best practices guide, and upgrade offer with limited-time discount. Include subject lines, preview text, and CTAs for each.',
};
