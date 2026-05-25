import type { Template } from '@/shared/types';

export const jobPostingTemplate: Template = {
  id: 'job-posting',
  name: 'Job Description',
  description: 'Compelling job postings that attract qualified candidates',
  icon: 'Users',
  domain: 'productivity',
  audienceHint: 'HR teams, hiring managers, and founders',
  framework: 'openai',
  defaultInput:
    'Write a job description for a Staff Machine Learning Engineer at an AI startup. Include: role overview, responsibilities, required qualifications (5+ years ML, Python, PyTorch), nice-to-haves (LLM fine-tuning, RAG systems), and company culture description. Aim for inclusive language that attracts diverse candidates.',
};
