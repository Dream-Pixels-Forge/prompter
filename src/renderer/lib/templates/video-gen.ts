import { type Template } from '@/shared/types';

export const videoGenTemplate: Template = {
  id: 'video-gen',
  name: 'Video Generation',
  description: 'Detailed prompt for AI video generation tools (Veo, Runway, Sora, etc.)',
  icon: 'Video',
  domain: 'creative',
  audienceHint: 'Content creators, filmmakers, marketers',
  framework: 'mplct',
  defaultInput:
    'Generate a cinematic 10-second product reveal for a minimalist smartwatch. Golden hour lighting, slow 360-degree orbit camera, smooth transitions from close-up macro shots of the titanium case to lifestyle wrist shots.',
};
