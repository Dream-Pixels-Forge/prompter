import { createOpenAICompatibleImpl } from './openai-compatible';

export const openaiImpl = createOpenAICompatibleImpl('openai', 'https://api.openai.com/v1');
