import type { Template } from '@/shared/types';

export const testPlanTemplate: Template = {
  id: 'test-plan',
  name: 'Test Plan / Cases',
  description: 'Generate comprehensive test plans and test cases from feature descriptions',
  icon: 'CheckSquare',
  domain: 'developer',
  audienceHint: 'QA engineers and developers writing tests',
  framework: 'karpathy',
  defaultInput:
    'Create a test plan for a user authentication system with email/password login, OAuth (Google/GitHub), password reset, and session management. Include unit tests, integration tests, edge cases (rate limiting, expired tokens, concurrent sessions), and security test scenarios.',
};
