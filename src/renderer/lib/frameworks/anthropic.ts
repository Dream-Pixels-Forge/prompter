import { type Framework } from '@/shared/types';

export const anthropicFramework: Framework = {
  id: 'anthropic',
  name: 'Anthropic Playbook',
  description: 'Playbook-style system prompt template for Anthropic Claude model interactions',
  sections: [
    {
      key: 'role',
      label: 'Role',
      placeholder: 'Function, context, and domain',
    },
    {
      key: 'guidelines',
      label: 'Guidelines',
      placeholder: 'Behavioral rules and decision framework',
    },
    {
      key: 'policy',
      label: 'Policy',
      placeholder: 'Boundaries, invariants, and prohibited actions',
    },
    {
      key: 'outputContract',
      label: 'Output Contract',
      placeholder: 'Exact format specification',
    },
    {
      key: 'stopSequences',
      label: 'Stop Sequences',
      placeholder: 'When to stop, ask, or escalate',
    },
  ],
};
