import { createOpenAICompatibleImpl } from './openai-compatible';

export const groqImpl = createOpenAICompatibleImpl('groq', 'https://api.groq.com/openai/v1');
