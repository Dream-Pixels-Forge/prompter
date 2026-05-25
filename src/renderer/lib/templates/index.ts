import type { Template } from '@/shared/types';
import { agentPromptTemplate } from './agent-prompt';
import { apiDocsTemplate } from './api-docs';
import { architectureTemplate } from './architecture';
import { blogPostTemplate } from './blog-post';
import { cliToolTemplate } from './cli-tool';
import { codeReviewTemplate } from './code-review';
import { competitorAnalysisTemplate } from './competitor-analysis';
import { cookingBookTemplate } from './cooking-book';
import { coverLetterTemplate } from './cover-letter';
import { dataAnalysisTemplate } from './data-analysis';
import { dbSchemaTemplate } from './db-schema';
import { emailCampaignTemplate } from './email-campaign';
import { jobPostingTemplate } from './job-posting';
import { legalTemplate } from './legal';
import { mcpServerTemplate } from './mcp-server';
import { meetingNotesTemplate } from './meeting-notes';
import { newsletterTemplate } from './newsletter';
import { onboardingTemplate } from './onboarding';
import { pitchDeckTemplate } from './pitch-deck';
import { podcastScriptTemplate } from './podcast-script';
import { prdTemplate } from './prd';
import { productLaunchTemplate } from './product-launch';
import { researchPaperTemplate } from './research-paper';
import { resumeTemplate } from './resume';
import { saasLandingTemplate } from './saas-landing';
import { seoContentTemplate } from './seo-content';
import { socialMediaTemplate } from './social-media';
import { supportAgentTemplate } from './support-agent';
import { testPlanTemplate } from './test-plan';
import { tutorialTemplate } from './tutorial';
import { uxBriefTemplate } from './ux-brief';
import { videoGenTemplate } from './video-gen';

export const templates: Template[] = [
  // Dev
  mcpServerTemplate,
  codeReviewTemplate,
  agentPromptTemplate,
  architectureTemplate,
  cliToolTemplate,
  dbSchemaTemplate,
  testPlanTemplate,
  apiDocsTemplate,

  // Content
  blogPostTemplate,
  videoGenTemplate,
  socialMediaTemplate,
  newsletterTemplate,
  seoContentTemplate,
  tutorialTemplate,
  podcastScriptTemplate,
  cookingBookTemplate,

  // Business
  saasLandingTemplate,
  dataAnalysisTemplate,
  prdTemplate,
  supportAgentTemplate,
  pitchDeckTemplate,
  productLaunchTemplate,
  emailCampaignTemplate,
  competitorAnalysisTemplate,

  // Misc / Productivity
  uxBriefTemplate,
  researchPaperTemplate,
  resumeTemplate,
  meetingNotesTemplate,
  jobPostingTemplate,
  onboardingTemplate,
  legalTemplate,
  coverLetterTemplate,
];

export function getTemplate(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}
