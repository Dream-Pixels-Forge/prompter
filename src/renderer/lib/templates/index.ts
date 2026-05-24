import type { Template } from '@/shared/types';
import { agentPromptTemplate } from './agent-prompt';
import { apiDocsTemplate } from './api-docs';
import { blogPostTemplate } from './blog-post';
import { codeReviewTemplate } from './code-review';
import { cookingBookTemplate } from './cooking-book';
import { dataAnalysisTemplate } from './data-analysis';
import { prdTemplate } from './prd';
import { researchPaperTemplate } from './research-paper';
import { saasLandingTemplate } from './saas-landing';
import { supportAgentTemplate } from './support-agent';
import { uxBriefTemplate } from './ux-brief';
import { videoGenTemplate } from './video-gen';

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
  return templates.find((t) => t.id === id);
}
