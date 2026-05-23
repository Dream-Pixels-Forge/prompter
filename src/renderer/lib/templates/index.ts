import { type Template } from '@/shared/types';
import { saasLandingTemplate } from './saas-landing';
import { cookingBookTemplate } from './cooking-book';
import { apiDocsTemplate } from './api-docs';
import { agentPromptTemplate } from './agent-prompt';
import { codeReviewTemplate } from './code-review';
import { videoGenTemplate } from './video-gen';
import { blogPostTemplate } from './blog-post';
import { supportAgentTemplate } from './support-agent';
import { dataAnalysisTemplate } from './data-analysis';
import { uxBriefTemplate } from './ux-brief';
import { prdTemplate } from './prd';
import { researchPaperTemplate } from './research-paper';

export const templates: Template[] = [
  saasLandingTemplate,
  cookingBookTemplate,
  apiDocsTemplate,
  agentPromptTemplate,
  codeReviewTemplate,
  videoGenTemplate,
  blogPostTemplate,
  supportAgentTemplate,
  dataAnalysisTemplate,
  uxBriefTemplate,
  prdTemplate,
  researchPaperTemplate,
];

export function getTemplate(id: string): Template | undefined {
  return templates.find(t => t.id === id);
}

export function getTemplatesByFramework(framework: string): Template[] {
  return templates.filter(t => t.framework === framework);
}
