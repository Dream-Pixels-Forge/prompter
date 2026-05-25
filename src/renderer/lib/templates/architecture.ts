import type { Template } from '@/shared/types';

export const architectureTemplate: Template = {
  id: 'architecture',
  name: 'System Architecture',
  description: 'Design system architecture with components, data flow, and deployment strategy',
  icon: 'Network',
  domain: 'developer',
  audienceHint: 'Software architects and senior engineers',
  framework: 'openai',
  defaultInput:
    'Design a microservices architecture for a real-time collaborative document editing platform. Cover service decomposition, WebSocket management, conflict resolution (CRDT/OT), data persistence, and scaling strategy for 100K concurrent users.',
};
