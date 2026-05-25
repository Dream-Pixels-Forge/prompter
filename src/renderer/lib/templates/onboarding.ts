import type { Template } from '@/shared/types';

export const onboardingTemplate: Template = {
  id: 'onboarding',
  name: 'Onboarding Guide',
  description: 'User and employee onboarding documentation with clear progression paths',
  icon: 'Users',
  domain: 'productivity',
  audienceHint: 'Product managers, HR teams, and documentation writers',
  framework: 'openai',
  defaultInput:
    'Create a user onboarding guide for a developer tool that offers AI-powered code review. Include: getting started (install via npm), first review (running on a PR), configuration (custom rules, severity levels), team setup (Slack integration, GitHub app), and best practices for integrating into the development workflow.',
};
