import type { Template } from '@/shared/types';

export const seoContentTemplate: Template = {
  id: 'seo-content',
  name: 'SEO Content / Article',
  description: 'SEO-optimized content with keyword strategy and search-friendly structure',
  icon: 'Search',
  domain: 'content',
  audienceHint: 'Content marketers and SEO specialists',
  framework: 'openai',
  defaultInput:
    'Write an SEO-optimized article for "How to Build AI Agents in 2026". Target keyword: AI agent development. Include H2 sections on tool selection, architecture patterns, observability, and deployment. Aim for 2000 words with a clear meta description, internal linking opportunities, and FAQ schema markup.',
};
