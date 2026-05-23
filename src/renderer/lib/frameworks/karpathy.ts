import { type Framework } from '@/shared/types';

export const karpathyFramework: Framework = {
  id: 'karpathy',
  name: 'Karpathy Principles',
  description: 'System prompt template based on Andrej Karpathy\'s coding principles and guidelines',
  sections: [
    {
      key: 'thinkFirst',
      label: 'Think First',
      placeholder: 'State assumptions, surface tradeoffs, ask clarifying questions',
    },
    {
      key: 'simplicity',
      label: 'Simplicity',
      placeholder: 'Minimum code, no speculative features, no over-abstraction',
    },
    {
      key: 'surgical',
      label: 'Surgical',
      placeholder: 'Touch only what\'s needed, match existing style',
    },
    {
      key: 'goalDriven',
      label: 'Goal-Driven',
      placeholder: 'Define success criteria, loop until verified',
    },
  ],
};
