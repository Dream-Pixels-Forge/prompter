import type { Template } from '@/shared/types';

export const supportAgentTemplate: Template = {
  id: 'support-agent',
  name: 'Customer Support Agent',
  description: 'Conversational support agent prompt with escalation rules and brand voice',
  icon: 'Headphones',
  domain: 'business',
  audienceHint: 'Support teams, CS managers',
  framework: 'anthropic',
  defaultInput:
    'Create a customer support agent prompt for a SaaS project management tool. The agent should handle billing questions, feature requests, and technical troubleshooting. Always escalate unresolved issues within 3 messages. Maintain a helpful but professional tone.',
};
