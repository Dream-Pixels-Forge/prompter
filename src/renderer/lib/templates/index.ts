import { type Template } from '@/shared/types';
import { saasLandingTemplate } from './saas-landing';
import { cookingBookTemplate } from './cooking-book';
import { apiDocsTemplate } from './api-docs';

// Phase 1: 3 templates. More added in Phase 2.
export const templates: Template[] = [
  saasLandingTemplate,
  cookingBookTemplate,
  apiDocsTemplate,
];

export function getTemplate(id: string): Template | undefined {
  return templates.find(t => t.id === id);
}

export function getTemplatesByFramework(framework: string): Template[] {
  return templates.filter(t => t.framework === framework);
}
