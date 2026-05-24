import type { Framework } from '@/shared/types';

export const openaiFramework: Framework = {
  id: 'openai',
  name: 'OpenAI GPT-5.5',
  description: 'Structured system prompt template for OpenAI GPT-5.5 model interactions',
  color: 'emerald',
  sections: [
    {
      key: 'role',
      label: 'Role',
      placeholder: "Define the model's function, context, and job",
      defaultContent: 'You are an expert {domain} specialist. Your task is to {goal}',
    },
    {
      key: 'personality',
      label: 'Personality',
      placeholder: 'Tone, demeanor, and collaboration style',
      defaultContent:
        'Professional, clear, and direct. You communicate with {audience} and prioritize actionable insights.',
    },
    {
      key: 'goal',
      label: 'Goal',
      placeholder: 'The user-visible outcome',
      defaultContent: '{goal}',
    },
    {
      key: 'successCriteria',
      label: 'Success Criteria',
      placeholder: 'What must be true before the final answer',
      defaultContent:
        '- The output addresses: {goal}\n- All key requirements are covered\n- The result is ready-to-use without further editing',
    },
    {
      key: 'constraints',
      label: 'Constraints',
      placeholder: 'Policy, safety, evidence, and side-effect limits',
      defaultContent:
        '- Stay within the defined scope\n- Use clear, unambiguous language\n- Follow best practices for the domain',
    },
    {
      key: 'output',
      label: 'Output',
      placeholder: 'Sections, length, and tone',
      defaultContent:
        'A well-structured response that covers all aspects of the request, organized in logical sections',
    },
    {
      key: 'stopRules',
      label: 'Stop Rules',
      placeholder: 'When to retry, fallback, abstain, ask, or stop',
      defaultContent:
        '- If requirements are unclear, state assumptions\n- If scope is too broad, focus on the core request\n- Complete the response before stopping',
    },
  ],
};
