import type { Framework } from '@/shared/types';

export const karpathyFramework: Framework = {
  id: 'karpathy',
  name: 'Karpathy Principles',
  description: "System prompt template based on Andrej Karpathy's coding principles and guidelines",
  color: 'blue',
  sections: [
    {
      key: 'thinkFirst',
      label: 'Think First',
      placeholder: 'State assumptions, surface tradeoffs, ask clarifying questions',
      defaultContent:
        "Before responding, consider: what assumptions am I making about this request? What's the simplest approach that solves the problem? The user's goal is: {goal}",
    },
    {
      key: 'simplicity',
      label: 'Simplicity',
      placeholder: 'Minimum code, no speculative features, no over-abstraction',
      defaultContent:
        'Use the minimum necessary complexity. No speculative features, no over-engineering, no abstractions for single-use scenarios.',
    },
    {
      key: 'surgical',
      label: 'Surgical',
      placeholder: "Touch only what's needed, match existing style",
      defaultContent: "Touch only what's needed. Stay within scope. Match existing patterns and conventions.",
    },
    {
      key: 'goalDriven',
      label: 'Goal-Driven',
      placeholder: 'Define success criteria, loop until verified',
      defaultContent:
        'The user\'s goal is: {goal}. Define what success looks like for this specific request. Verify against requirements. Loop until the goal is met.',
    },
  ],
};
