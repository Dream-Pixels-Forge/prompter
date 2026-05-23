import { type Framework } from '@/shared/types';

export const contextEngFramework: Framework = {
  id: 'context-eng',
  name: 'Context Engineering',
  description: 'Structured context framework for knowledge-intensive agent and assistant interactions',
  sections: [
    {
      key: 'context',
      label: 'Context',
      placeholder: 'Background knowledge, project scope, user profile, domain info',
    },
    {
      key: 'memory',
      label: 'Memory',
      placeholder: 'Past interactions, stored facts, persistent state',
    },
    {
      key: 'skills',
      label: 'Skills & SOPs',
      placeholder: 'Step-by-step procedures, protocols, capability definitions',
    },
    {
      key: 'tools',
      label: 'Tools & Resources',
      placeholder: 'Available APIs, data sources, files, search endpoints',
    },
    {
      key: 'outputContract',
      label: 'Output Contract',
      placeholder: 'Format, structure, metadata requirements',
    },
  ],
};
