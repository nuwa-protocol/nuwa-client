import { createAnthropic } from '@ai-sdk/anthropic';
import { createAzure } from '@ai-sdk/azure';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createMistral } from '@ai-sdk/mistral';
import { createOpenAI } from '@ai-sdk/openai';
import { createTogetherAI } from '@ai-sdk/togetherai';
import { createXai } from '@ai-sdk/xai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { LLM_GATEWAY_BASE_URL } from '@/shared/config/llm-gateway';
import { createPaymentFetch } from '@/shared/services/payment-fetch';
import type { CapModel } from '@/shared/types';

export const LLMProvider = (model: CapModel) => {
  const paymentFetch = createPaymentFetch({ extraBody: {...model.parameters,
      model: model.modelId}});
  const providerSettings = {
    apiKey: 'NOT-USED',
    baseURL: model.customGatewayUrl || LLM_GATEWAY_BASE_URL,
    fetch: paymentFetch,
  };

  const providerId = model.providerId;
  const modelId = model.modelId;

  switch (providerId) {
    case 'openrouter':
      return createOpenRouter(providerSettings)(modelId);
    case 'openai_chat_completion':
      return createOpenAI(providerSettings).chat(modelId);
    case 'openai_responses':
      return createOpenAI(providerSettings).responses(modelId);
    case 'anthropic':
      return createAnthropic(providerSettings)(modelId);
    case 'google':
      return createGoogleGenerativeAI(providerSettings)(modelId);
    case 'xai':
      return createXai(providerSettings)(modelId);
    case 'groq':
      return createGroq(providerSettings)(modelId);
    case 'togetherai':
      return createTogetherAI(providerSettings)(modelId);
    case 'azure':
      return createAzure(providerSettings)(modelId);
    case 'deepseek':
      return createDeepSeek(providerSettings)(modelId);
    case 'mistral':
      return createMistral(providerSettings)(modelId);
    default:
      throw new Error(`Unsupported provider: ${providerId}`);
  }
};

export const UtilityLLMProvider = () => {
  const paymentFetch = createPaymentFetch();
  const UtilityProviderSettings = {
    apiKey: 'NOT-USED',
    baseURL: LLM_GATEWAY_BASE_URL,
    fetch: paymentFetch,
  };

  return createOpenRouter(UtilityProviderSettings).chat('openai/gpt-4o-mini');
};