import { getFramework } from '../../shared/frameworks';
import type { GenerateRequest, GenerateResponse, ProviderType } from '../../shared/types';
import { generateAnthropic } from './anthropic';
import { checkOllamaStatus, generateOllama } from './ollama';
import { generateOpenAI } from './openai';

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
    sections[section.key] = buildSectionContent(section.key, req.input, framework.sections);
  }

  const structuredPrompt = framework.sections.map((s) => `### ${s.label}\n${sections[s.key]}`).join('\n\n');

  const provider = activeConfig.activeProvider;
  let llmOutput: string;

  try {
    llmOutput = await callLLM(provider, structuredPrompt);
  } catch (err) {
    console.warn(`LLM ${provider} failed, using local fallback:`, err);
    return { sections, raw: structuredPrompt, framework: req.framework, template: req.template };
  }

  const parsedSections = parseLLMOutput(
    llmOutput,
    framework.sections.map((s) => s.key),
  );

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
    const fuzzyKeys = [
      key,
      key.replace(/([A-Z])/g, ' $1').trim(),
      ...key.split(/(?=[A-Z])/).map((k) => k.toLowerCase()),
    ];
    for (const lookup of [...new Set(fuzzyKeys)]) {
      const escaped = lookup.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`#{1,3}\\s+${escaped}[\\s\\S]*?(?=#{1,3}\\s+|$)`, 'i');
      const match = output.match(regex);
      if (match) {
        const content = match[0].replace(/^#{1,3}\s+.*$/m, '').trim();
        result[key] = content;
        break;
      }
    }
  }
  return result;
}

export function buildSectionContent(
  key: string,
  input: string,
  sections: { key: string; defaultContent: string }[],
): string {
  const section = sections.find((s) => s.key === key);
  const template = section?.defaultContent || '{goal}';

  return template
    .replace(/\{goal\}/g, extractGoal(input))
    .replace(/\{domain\}/g, extractDomain(input))
    .replace(/\{audience\}/g, extractAudienceTone(input));
}

export function extractDomain(input: string): string {
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

export function extractGoal(input: string): string {
  const clean = input.replace(/^(create|write|generate|build|make|develop)\s+/i, '').trim();
  const firstSentence = clean.split(/[.!?]/)[0]?.trim() || clean;
  return firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);
}

export function extractAudienceTone(input: string): string {
  if (/professional|enterprise|business|b2b|corporate/i.test(input)) return 'professional authority';
  if (/casual|friendly|fun|creative|playful/i.test(input)) return 'approachable warmth';
  if (/technical|developer|engineer|coder|api/i.test(input)) return 'technical precision';
  if (/luxury|premium|exclusive|high.?end/i.test(input)) return 'sophisticated elegance';
  return 'clear professionalism';
}
