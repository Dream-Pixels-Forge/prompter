import type { Template } from '@/shared/types';

export const podcastScriptTemplate: Template = {
  id: 'podcast-script',
  name: 'Podcast Script',
  description: 'Episode scripts with narrative arc, talking points, and production notes',
  icon: 'Headphones',
  domain: 'content',
  audienceHint: 'Podcasters, content creators, and showrunners',
  framework: 'anthropic',
  defaultInput:
    'Write a 30-minute podcast episode script titled "The Agentic Awakening: How AI Agents Are Reshaping Software Engineering." Format: host and one guest. Include intro hook, guest background, 4 discussion segments (current state, architecture challenges, future predictions, advice for builders), and a closing summary with call-to-action.',
};
