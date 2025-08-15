import { LLM_GATEWAY_BASE_URL } from '@/shared/config/llm-gateway';
import { createPaymentFetch } from '@/shared/services/payment-fetch';
import { createOpenRouter } from './openrouter-provider';

// Settings of Nuwa LLM Gateway
const baseURL = LLM_GATEWAY_BASE_URL;
const providerSettings = {
  apiKey: 'NOT-USED', // specify a fake api key to avoid provider errors
  baseURL,
  fetch: createPaymentFetch(baseURL),
};

const openrouter = createOpenRouter(providerSettings);

// Export a provider that dynamically resolves models
export const llmProvider = {
  chat: (modelId: string) => {
    return openrouter.chat(modelId);
  },
  utility: () => {
    return openrouter.chat('openai/gpt-4o-mini');
  },
};
