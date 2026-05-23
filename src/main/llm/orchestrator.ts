import { generateOllama, checkOllamaStatus } from './ollama';
import { generateOpenAI } from './openai';
import { generateAnthropic } from './anthropic';
import { getFramework } from '../../renderer/lib/frameworks';
import { type GenerateRequest, type GenerateResponse, type ProviderType } from '../../shared/types';

const DEFAULTS = {
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
  openaiModel: 'gpt-4o',
  anthropicModel: 'claude-sonnet-4-20250514',
};

let activeConfig = {
  activeProvider: 'ollama' as ProviderType,
  ollamaEndpoint: DEFAULTS.ollamaEndpoint,
  ollamaModel: DEFAULTS.ollamaModel,
  openaiModel: DEFAULTS.openaiModel,
  openaiApiKey: '',
  anthropicModel: DEFAULTS.anthropicModel,
  anthropicApiKey: '',
};

export function updateConfig(config: Partial<typeof activeConfig>) {
  activeConfig = { ...activeConfig, ...config };
}

export async function generatePrompt(req: GenerateRequest): Promise<GenerateResponse> {
  const framework = getFramework(req.framework);
  if (!framework) throw new Error(`Unknown framework: ${req.framework}`);

  const sections: Record<string, string> = {};
  for (const section of framework.sections) {
    sections[section.key] = buildSectionContent(section.key, section.label, req.input);
  }

  const structuredPrompt = framework.sections
    .map(s => `### ${s.label}\n${sections[s.key]}`)
    .join('\n\n');

  const provider = activeConfig.activeProvider;
  let llmOutput: string;

  try {
    llmOutput = await callLLM(provider, structuredPrompt);
  } catch (err) {
    console.warn(`LLM ${provider} failed, using local fallback:`, err);
    return { sections, raw: structuredPrompt, framework: req.framework, template: req.template };
  }

  const parsedSections = parseLLMOutput(llmOutput, framework.sections.map(s => s.key));

  return {
    sections: Object.keys(parsedSections).length > 0 ? parsedSections : sections,
    raw: llmOutput,
    framework: req.framework,
    template: req.template,
  };
}

async function callLLM(provider: ProviderType, prompt: string): Promise<string> {
  switch (provider) {
    case 'ollama':
      return generateOllama({ model: activeConfig.ollamaModel, prompt, baseUrl: activeConfig.ollamaEndpoint });
    case 'openai':
      if (!activeConfig.openaiApiKey) throw new Error('OpenAI API key not configured');
      return generateOpenAI({ model: activeConfig.openaiModel, prompt, apiKey: activeConfig.openaiApiKey });
    case 'anthropic':
      if (!activeConfig.anthropicApiKey) throw new Error('Anthropic API key not configured');
      return generateAnthropic({ model: activeConfig.anthropicModel, prompt, apiKey: activeConfig.anthropicApiKey });
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

function parseLLMOutput(output: string, sectionKeys: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of sectionKeys) {
    const regex = new RegExp(`#{1,3}\\s+${key}[\\s\\S]*?(?=#{1,3}\\s+|$)`, 'i');
    const match = output.match(regex);
    if (match) {
      const content = match[0].replace(/^#{1,3}\s+.*$/m, '').trim();
      result[key] = content;
    }
  }
  return result;
}

function buildSectionContent(key: string, _label: string, input: string): string {
  const _lines = input.split('\n').filter(l => l.trim());

  switch (key) {
    case 'role':
      return `You are an expert ${extractDomain(input)} specialist. Your task is to ${extractGoal(input).toLowerCase()}`;
    case 'personality':
      return `Professional, clear, and direct. You communicate with ${extractAudienceTone(input)} and prioritize actionable insights.`;
    case 'goal':
      return extractGoal(input);
    case 'successCriteria':
      return `- The output addresses: ${extractGoal(input)}\n- All key requirements are covered\n- The result is ready-to-use without further editing`;
    case 'constraints':
      return `- Stay within the defined scope\n- Use clear, unambiguous language\n- Follow best practices for the domain`;
    case 'output':
      return `A well-structured response that covers all aspects of the request, organized in logical sections`;
    case 'stopRules':
      return `- If requirements are unclear, state assumptions\n- If scope is too broad, focus on the core request\n- Complete the response before stopping`;
    case 'thinkFirst':
      return `Before responding, consider: what assumptions am I making about this request? What's the simplest approach that solves the problem?`;
    case 'simplicity':
      return `Use the minimum necessary complexity. No speculative features, no over-engineering, no abstractions for single-use scenarios.`;
    case 'surgical':
      return `Touch only what's needed. Stay within scope. Match existing patterns and conventions.`;
    case 'goalDriven':
      return `Define what success looks like. Verify against requirements. Loop until the goal is met.`;
    case 'guidelines':
      return `- Analyze the request thoroughly\n- Apply domain best practices\n- Provide structured, actionable output\n- Be transparent about assumptions`;
    case 'policy':
      return `- Do not invent facts or specifications\n- Stay within the defined domain\n- Respect user constraints and requirements`;
    case 'outputContract':
      return `Provide a complete, structured response that directly addresses the request`;
    case 'stopSequences':
      return `Stop when the core request is fully addressed and actionable. Ask for clarification only if critical information is missing.`;
    default:
      return extractGoal(input);
  }
}

function extractDomain(input: string): string {
  const domains: [RegExp, string][] = [
    [/saas|software|app|platform|dashboard/i, 'SaaS/product'],
    [/recipe|cook|kitchen|food|meal/i, 'culinary/food'],
    [/api|endpoint|rest|graphql|sdk/i, 'API/developer'],
    [/video|film|animation|motion|3d/i, 'video/animation'],
    [/agent|assistant|automation|workflow/i, 'agent/AI'],
    [/blog|article|post|content|writing/i, 'content/writing'],
    [/support|ticket|helpdesk|customer|service/i, 'customer support'],
    [/data|analytics|report|metric|dashboard/i, 'data/analytics'],
    [/design|ui|ux|interface/i, 'design/UX'],
    [/documentation|guide|manual/i, 'technical writing'],
  ];

  for (const [pattern, domain] of domains) {
    if (pattern.test(input)) return domain;
  }
  return 'general';
}

function extractGoal(input: string): string {
  const clean = input.replace(/^(create|write|generate|build|make|develop)\s+/i, '').trim();
  const firstSentence = clean.split(/[.!?]/)[0]?.trim() || clean;
  return firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);
}

function extractAudienceTone(input: string): string {
  if (/professional|enterprise|business|b2b|corporate/i.test(input)) return 'professional authority';
  if (/casual|friendly|fun|creative|playful/i.test(input)) return 'approachable warmth';
  if (/technical|developer|engineer|coder|api/i.test(input)) return 'technical precision';
  if (/luxury|premium|exclusive|high.?end/i.test(input)) return 'sophisticated elegance';
  return 'clear professionalism';
}
