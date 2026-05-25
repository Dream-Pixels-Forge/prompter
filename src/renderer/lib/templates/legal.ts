import type { Template } from '@/shared/types';

export const legalTemplate: Template = {
  id: 'legal-template',
  name: 'Legal / Policy Docs',
  description: 'Terms of service, privacy policies, and legal disclaimers',
  icon: 'Shield',
  domain: 'productivity',
  audienceHint: 'Founders, legal teams, and product managers',
  framework: 'openai',
  defaultInput:
    'Draft a Terms of Service and Privacy Policy for a B2B SaaS platform that uses AI to process customer data. Cover: data handling, AI model training opt-out, data retention, GDPR/CCPA compliance, service level agreement, limitation of liability, and dispute resolution. Use plain language where possible.',
};
