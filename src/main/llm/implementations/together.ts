import { createOpenAICompatibleImpl } from './openai-compatible';

export const togetherImpl = createOpenAICompatibleImpl('together', 'https://api.together.xyz/v1');
