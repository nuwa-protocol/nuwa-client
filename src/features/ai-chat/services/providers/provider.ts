import { createOpenAI } from '@ai-sdk/openai';
import { createPerplexity } from '@ai-sdk/perplexity';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createProviderRegistry } from 'ai';
import { createAuthorizedFetch } from './fetch';

// Base URL of Nuwa LLM Gateway
const BASE_URL = 'https://test-llm.nuwa.dev/api/v1';

const openrouter = createOpenRouter({
  apiKey: 'NOT_USED',
  baseURL: BASE_URL,
  fetch: createAuthorizedFetch(),
});

const openai = createOpenAI({
  apiKey: 'NOT_USED',
  baseURL: BASE_URL,
  fetch: createAuthorizedFetch(),
});

const perplexity = createPerplexity({
  apiKey: 'NOT_USED',
  baseURL: BASE_URL,
  fetch: createAuthorizedFetch(),
});

export const providerRegistry = createProviderRegistry(
  {
    openrouter: {
      ...openrouter,
      // Adding the stub here until a fix is released: https://github.com/OpenRouterTeam/ai-sdk-provider/issues/62#issuecomment-2972002939
      textEmbeddingModel: () => {
        throw new Error('OpenRouter does not support text embeddings');
      },
    },
    openai,
    perplexity,
  },
  { separator: '>' },
);
