import { type Template } from '@/shared/types';

export const researchPaperTemplate: Template = {
  id: 'research-paper',
  name: 'Scientific Research Paper',
  description: 'Structured academic paper prompt with methodology, results, and citations',
  icon: 'Microscope',
  domain: 'academic',
  audienceHint: 'Researchers, academics, students',
  framework: 'karpathy',
  defaultInput:
    'Outline a research paper on the effectiveness of multi-agent LLM architectures for software engineering tasks. Include abstract, introduction, related work, methodology (with evaluation metrics), results (with ablation studies), discussion of limitations, and conclusion. Target venue: ICML or NeurIPS.',
};
