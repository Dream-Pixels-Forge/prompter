import { createOpenAICompatibleImpl } from './openai-compatible';

export const mistralImpl = createOpenAICompatibleImpl('mistral', 'https://api.mistral.ai/v1');
