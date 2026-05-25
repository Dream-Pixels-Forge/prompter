import type { Template } from '@/shared/types';

export const socialMediaTemplate: Template = {
  id: 'social-media',
  name: 'Social Media Content',
  description: 'Engaging posts for Twitter/X, LinkedIn, Instagram, and TikTok',
  icon: 'Hash',
  domain: 'content',
  audienceHint: 'Social media managers and content creators',
  framework: 'anthropic',
  defaultInput:
    'Create a LinkedIn content thread about 5 lessons learned building AI products in production. Target audience is senior engineers and product leaders. Tone should be thoughtful and experience-driven. Each post should be 200-300 characters with a hook, insight, and CTA.',
};
