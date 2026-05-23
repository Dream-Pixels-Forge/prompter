import { type Framework } from '@/shared/types';

export const openaiFramework: Framework = {
  id: 'openai',
  name: 'OpenAI GPT-5.5',
  description: 'Structured system prompt template for OpenAI GPT-5.5 model interactions',
  sections: [
    {
      key: 'role',
      label: 'Role',
      placeholder: 'Define the model\'s function, context, and job',
    },
    {
      key: 'personality',
      label: 'Personality',
      placeholder: 'Tone, demeanor, and collaboration style',
    },
    {
      key: 'goal',
      label: 'Goal',
      placeholder: 'The user-visible outcome',
    },
    {
      key: 'successCriteria',
      label: 'Success Criteria',
      placeholder: 'What must be true before the final answer',
    },
    {
      key: 'constraints',
      label: 'Constraints',
      placeholder: 'Policy, safety, evidence, and side-effect limits',
    },
    {
      key: 'output',
      label: 'Output',
      placeholder: 'Sections, length, and tone',
    },
    {
      key: 'stopRules',
      label: 'Stop Rules',
      placeholder: 'When to retry, fallback, abstain, ask, or stop',
    },
  ],
};
