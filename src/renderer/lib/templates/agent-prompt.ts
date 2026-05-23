import { type Template } from '@/shared/types';

export const agentPromptTemplate: Template = {
  id: 'agent-prompt',
  name: 'Agent Instructions',
  description: 'System prompt for AI agents with tools, functions, and autonomous behavior',
  icon: 'Bot',
  domain: 'developer',
  audienceHint: 'Engineers building AI agent systems',
  framework: 'karpathy',
  defaultInput:
    'Create a system prompt for an AI coding agent that can read files, run tests, and commit code. It should think before acting, make surgical changes, and verify success criteria before stopping.',
};
