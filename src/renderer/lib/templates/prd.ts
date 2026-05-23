import { type Template } from '@/shared/types';

export const prdTemplate: Template = {
  id: 'prd',
  name: 'Product Requirements Doc',
  description: 'Structured product requirements document with user stories and acceptance criteria',
  icon: 'FileText',
  domain: 'business',
  audienceHint: 'Product managers, founders, stakeholders',
  framework: 'openai',
  defaultInput:
    'Write a PRD for a real-time collaboration feature in a document editor. Include user stories for concurrent editing, comment threads, version history, and presence indicators. Define acceptance criteria, non-functional requirements, and out-of-scope items.',
};
