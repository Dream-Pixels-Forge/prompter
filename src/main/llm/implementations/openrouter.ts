import { createOpenAICompatibleImpl } from './openai-compatible';

export const openrouterImpl = createOpenAICompatibleImpl('openrouter', 'https://openrouter.ai/api/v1', {
  'HTTP-Referer': 'https://prompter.app',
  'X-Title': 'Prompter',
});
