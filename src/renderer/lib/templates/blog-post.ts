import type { Template } from '@/shared/types';

export const blogPostTemplate: Template = {
  id: 'blog-post',
  name: 'Blog Post / Article',
  description: 'Well-structured long-form blog post or editorial article',
  icon: 'PenLine',
  domain: 'content',
  audienceHint: 'Writers, marketers, thought leaders',
  framework: 'openai',
  defaultInput:
    'Write a 1500-word blog post about the rise of agentic AI in software development. Target audience is senior engineers and engineering managers. Include real-world use cases, architectural patterns, and practical getting-started advice.',
};
