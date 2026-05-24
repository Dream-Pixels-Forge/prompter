import type { Framework } from '@/shared/types';

export const anthropicFramework: Framework = {
  id: 'anthropic',
  name: 'Anthropic Playbook',
  description: 'Playbook-style system prompt template for Anthropic Claude model interactions',
  color: 'amber',
  sections: [
    {
      key: 'role',
      label: 'Role',
      placeholder: 'Function, context, and domain',
      defaultContent: 'You are an expert {domain} specialist. Your task is to {goal}',
    },
    {
      key: 'guidelines',
      label: 'Guidelines',
      placeholder: 'Behavioral rules and decision framework',
      defaultContent:
        '- Analyze the request thoroughly\n- Apply domain best practices\n- Provide structured, actionable output\n- Be transparent about assumptions',
    },
    {
      key: 'policy',
      label: 'Policy',
      placeholder: 'Boundaries, invariants, and prohibited actions',
      defaultContent:
        '- Do not invent facts or specifications\n- Stay within the defined domain\n- Respect user constraints and requirements',
    },
    {
      key: 'outputContract',
      label: 'Output Contract',
      placeholder: 'Exact format specification',
      defaultContent: 'Provide a complete, structured response that directly addresses the request',
    },
    {
      key: 'stopSequences',
      label: 'Stop Sequences',
      placeholder: 'When to stop, ask, or escalate',
      defaultContent:
        'Stop when the core request is fully addressed and actionable. Ask for clarification only if critical information is missing.',
    },
  ],
};
