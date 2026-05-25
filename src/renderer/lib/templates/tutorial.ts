import type { Template } from '@/shared/types';

export const tutorialTemplate: Template = {
  id: 'tutorial',
  name: 'Tutorial / How-To',
  description: 'Step-by-step tutorials with code examples and clear learning objectives',
  icon: 'GraduationCap',
  domain: 'content',
  audienceHint: 'Educators, technical writers, and content creators',
  framework: 'openai',
  defaultInput:
    'Write a beginner-friendly tutorial on building a real-time chat application with Next.js, WebSockets, and Redis. Include setup steps, code snippets, architecture diagram (described), common pitfalls, and a working demo. Target audience: intermediate web developers familiar with React.',
};
