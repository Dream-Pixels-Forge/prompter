import type { Template } from '@/shared/types';

export const coverLetterTemplate: Template = {
  id: 'cover-letter',
  name: 'Cover Letter',
  description: 'Tailored cover letters that connect experience to role requirements',
  icon: 'FileText',
  domain: 'productivity',
  audienceHint: 'Job seekers and career changers',
  framework: 'openai',
  defaultInput:
    'Write a cover letter for a Senior Product Manager position at a Series B AI startup. The candidate has 6 years of PM experience including 3 years at a SaaS company. Highlight: shipped 2 AI features, led a cross-functional team of 12, grew a metric by 200%. Connect each qualification to the job requirements listed in the posting.',
};
