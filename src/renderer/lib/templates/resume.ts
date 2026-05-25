import type { Template } from '@/shared/types';

export const resumeTemplate: Template = {
  id: 'resume',
  name: 'Resume / CV',
  description: 'ATS-optimized resumes with achievement-focused bullet points',
  icon: 'FileText',
  domain: 'productivity',
  audienceHint: 'Job seekers and professionals',
  framework: 'openai',
  defaultInput:
    'Create a resume for a senior frontend engineer with 8 years of experience specializing in React, TypeScript, and design systems. Highlight achievements at each role using quantified impact (e.g., "Reduced bundle size by 40%"). Target: FAANG-level engineering roles. Optimize for ATS parsing.',
};
