import { createOpenAICompatibleImpl } from './openai-compatible';

export const fireworksImpl = createOpenAICompatibleImpl('fireworks', 'https://api.fireworks.ai/inference/v1');
