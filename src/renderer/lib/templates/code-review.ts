import { type Template } from '@/shared/types';

export const codeReviewTemplate: Template = {
  id: 'code-review',
  name: 'Code Review Prompt',
  description: 'Structured prompt for reviewing code with actionable feedback',
  icon: 'GitPullRequest',
  domain: 'developer',
  audienceHint: 'Developers reviewing pull requests',
  framework: 'karpathy',
  defaultInput:
    'Review this TypeScript React component for code quality issues. Check for unnecessary complexity, proper error handling, performance bottlenecks, and adherence to the principle of surgical changes.',
};
