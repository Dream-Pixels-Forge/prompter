import type { Framework } from '@/shared/types';

export const contextEngFramework: Framework = {
  id: 'context-eng',
  name: 'Context Engineering',
  description: 'Structured context framework for knowledge-intensive agent and assistant interactions',
  color: 'rose',
  sections: [
    {
      key: 'context',
      label: 'Context',
      placeholder: 'Background knowledge, project scope, user profile, domain info',
      defaultContent: 'The working context covers: {goal}',
    },
    {
      key: 'memory',
      label: 'Memory',
      placeholder: 'Past interactions, stored facts, persistent state',
      defaultContent: 'Previous interactions and persistent state inform this response',
    },
    {
      key: 'skills',
      label: 'Skills & SOPs',
      placeholder: 'Step-by-step procedures, protocols, capability definitions',
      defaultContent: 'Follow established procedures relevant to: {goal}',
    },
    {
      key: 'tools',
      label: 'Tools & Resources',
      placeholder: 'Available APIs, data sources, files, search endpoints',
      defaultContent: 'Available resources should be leveraged to address: {goal}',
    },
    {
      key: 'outputContract',
      label: 'Output Contract',
      placeholder: 'Format, structure, metadata requirements',
      defaultContent: 'Provide a complete, structured response that directly addresses the request',
    },
  ],
};
