import type { Template } from '@/shared/types';

export const pitchDeckTemplate: Template = {
  id: 'pitch-deck',
  name: 'Pitch Deck / Investor',
  description: 'Investor pitch deck content with narrative arc and key business metrics',
  icon: 'Rocket',
  domain: 'business',
  audienceHint: 'Founders and startup teams raising funding',
  framework: 'openai',
  defaultInput:
    'Create a pitch deck outline for an AI-powered customer support platform targeting Series A. Include problem, solution, market size (TAM/SAM/SOM), business model, traction metrics, competitive landscape, team background, and financial projections. Target: $5M raise from SaaS-focused VCs.',
};
