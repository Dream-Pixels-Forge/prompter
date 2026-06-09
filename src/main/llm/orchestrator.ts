import { getFramework } from '../../shared/frameworks';
import { PROVIDER_DEFINITIONS } from '../../shared/provider-definitions';
import type { AppSettings, GenerateRequest, GenerateResponse } from '../../shared/types';
import { getEngine, initEngine } from './index';

// Dynamic runtime configuration — no hardcoded provider fields
interface RuntimeConfig {
  activeProvider: string;
  providerConfigs: Record<string, { model: string; endpoint?: string }>;
  providerApiKeys: Record<string, string>;
}

function buildDefaults(): RuntimeConfig['providerConfigs'] {
  const configs: RuntimeConfig['providerConfigs'] = {};
  for (const def of PROVIDER_DEFINITIONS) {
    configs[def.id] = { model: def.defaultModel, endpoint: def.defaultEndpoint };
  }
  return configs;
}

const activeConfig: RuntimeConfig = {
  activeProvider: 'ollama',
  providerConfigs: buildDefaults(),
  providerApiKeys: {},
};

let engineInitialized = false;
let legacyMigrated = false;

function ensureEngine(): void {
  if (!engineInitialized) {
    initEngine({
      getApiKey: (service: string) => activeConfig.providerApiKeys[service] || null,
    });
    engineInitialized = true;
  }
}

export function getConfig(): Partial<AppSettings> {
  return {
    activeProvider: activeConfig.activeProvider,
    providerConfigs: activeConfig.providerConfigs,
  };
}

export function updateConfig(config: Partial<AppSettings> | Record<string, unknown>) {
  const c = config as Record<string, unknown>;

  // New format (providerConfigs map)
  if (c.providerConfigs && typeof c.providerConfigs === 'object') {
    const incoming = c.providerConfigs as Record<string, { model?: string; endpoint?: string }>;
    for (const [id, cfg] of Object.entries(incoming)) {
      if (activeConfig.providerConfigs[id]) {
        activeConfig.providerConfigs[id] = { ...activeConfig.providerConfigs[id], ...cfg };
      }
    }
  }

  // New format (providerApiKeys)
  let keysChanged = false;
  if (c.providerApiKeys && typeof c.providerApiKeys === 'object') {
    const incoming = c.providerApiKeys as Record<string, string>;
    for (const [id, key] of Object.entries(incoming)) {
      if (key) {
        activeConfig.providerApiKeys[id] = key;
        keysChanged = true;
      }
    }
  }

  // Legacy flat fields — migrate to new format
  // Guard: empty string is treated as absent (not a valid key)
  if (typeof c.openaiApiKey === 'string' && c.openaiApiKey) {
    activeConfig.providerApiKeys.openai = c.openaiApiKey as string;
    keysChanged = true;
  }
  if (typeof c.anthropicApiKey === 'string' && c.anthropicApiKey) {
    activeConfig.providerApiKeys.anthropic = c.anthropicApiKey as string;
    keysChanged = true;
  }

  // Note: no reinitEngine() needed — the KeyStore closure references activeConfig
  // by reference, so key changes are immediately visible to the engine.

  // Legacy flat fields — migrate to new format (only once)
  if (!legacyMigrated) {
    if (typeof c.ollamaModel === 'string') {
      activeConfig.providerConfigs.ollama = {
        model: c.ollamaModel as string,
        endpoint: (c.ollamaEndpoint as string) || activeConfig.providerConfigs.ollama.endpoint,
      };
    }
    if (typeof c.openaiModel === 'string') {
      activeConfig.providerConfigs.openai = {
        model: c.openaiModel as string,
        endpoint: activeConfig.providerConfigs.openai.endpoint,
      };
    }
    if (typeof c.anthropicModel === 'string') {
      activeConfig.providerConfigs.anthropic = {
        model: c.anthropicModel as string,
        endpoint: activeConfig.providerConfigs.anthropic.endpoint,
      };
    }
    legacyMigrated = true;
  }
  // Active provider
  if (typeof c.activeProvider === 'string') activeConfig.activeProvider = c.activeProvider;
}

function resolveProviderConfig(provider: string) {
  const cfg = activeConfig.providerConfigs[provider];
  if (!cfg) throw new Error(`Unknown provider: '${provider}'`);
  return {
    model: cfg.model,
    endpoint: cfg.endpoint,
    apiKey: activeConfig.providerApiKeys[provider],
  };
}

/**
 * Extended response that includes a fallback warning flag.
 * The renderer can use this to show a toast when local fallback was used.
 */
export interface GenerateResponseWithMeta extends GenerateResponse {
  fallbackUsed?: boolean;
  fallbackReason?: string;
}

export async function generatePrompt(req: GenerateRequest, signal?: AbortSignal): Promise<GenerateResponseWithMeta> {
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
    llmOutput = await callLLM(provider, structuredPrompt, signal);
  } catch (err) {
    // If cancelled, propagate the error — don't fall back to local generation
    if (err instanceof Error && err.name === 'AbortError') throw err;

    const reason = err instanceof Error ? err.message : 'Unknown error';
    console.warn(`[Orchestrator] LLM ${provider} failed (${reason}), using local template fallback`);

    // Return local template output with fallback flag so renderer can warn the user
    return {
      sections,
      raw: structuredPrompt,
      framework: req.framework,
      template: req.template,
      fallbackUsed: true,
      fallbackReason: `LLM unavailable (${provider}): ${reason}`,
    };
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
    fallbackUsed: false,
  };
}

async function callLLM(provider: string, prompt: string, signal?: AbortSignal): Promise<string> {
  const { model, endpoint, apiKey } = resolveProviderConfig(provider);
  ensureEngine();
  return getEngine().generate({
    providerId: provider,
    model,
    prompt,
    endpoint,
    apiKey,
    signal,
  });
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
      // Match from ### Header to next ### or #### or end — stops at ANY header boundary
      const regex = new RegExp(`#{1,3}\\s+${escaped}\\s*\n([\\s\\S]*?)(?=\n#{1,4}\\s+|$)`, 'i');
      const match = output.match(regex);
      if (match) {
        result[key] = (match[1] || '').trim();
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
    [/\bsaas\b|\bsoftware\b|\bplatform\b|\bdashboard\b/i, 'SaaS/product'],
    [/\brecipe\b|\bcook\b|\bkitchen\b|\bfood\b|\bmeal\b/i, 'culinary/food'],
    [/\bapi\b|\bendpoint\b|\brest\b|\bgraphql\b|\bsdk\b/i, 'API/developer'],
    [/\bvideo\b|\bfilm\b|\banimation\b|\bmotion\b|\b3d\b/i, 'video/animation'],
    [/\bagent\b|\bassistant\b|\bautomation\b|\bworkflow\b/i, 'agent/AI'],
    [/\bblog\b|\barticle\b|\bnewsletter\b|\bcontent\b|\bwriting\b/i, 'content/writing'],
    [/\bsupport\b|\bticket\b|\bhelpdesk\b|\bcustomer\b/i, 'customer support'],
    [/\bdata\b|\banalytics\b|\breport\b|\bmetric\b/i, 'data/analytics'],
    [/\bdesign\b|\bux\b|\binterface\b/i, 'design/UX'],
    [/\bdocumentation\b|\bguide\b|\bmanual\b/i, 'technical writing'],
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
  if (/(?:^|\W)(professional|enterprise|business|b2b|corporate)(?:\W|$)/i.test(input)) return 'professional authority';
  if (/(?:^|\W)(casual|friendly|fun|creative|playful)(?:\W|$)/i.test(input)) return 'approachable warmth';
  if (/(?:^|\W)(technical|developer|engineer|coder|api)(?:\W|$)/i.test(input)) return 'technical precision';
  if (/(?:^|\W)(luxury|premium|exclusive|high.?end)(?:\W|$)/i.test(input)) return 'sophisticated elegance';
  return 'clear professionalism';
}
