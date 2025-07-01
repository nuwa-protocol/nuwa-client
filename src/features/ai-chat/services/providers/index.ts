import { createOpenAI } from '@ai-sdk/openai';
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { ModelStateStore } from '../../stores/model-store';
import { createAuthorizedFetch } from './fetch';

// Base URL of Nuwa LLM Gateway
const BASE_URL = 'https://test-llm.nuwa.dev/api/v1';

// const openrouter = createOpenRouter({
//   apiKey: 'NOT_USED',
//   baseURL: BASE_URL,
//   fetch: createAuthorizedFetch(),
// });

const openai = createOpenAI({
  apiKey: 'NOT_USED',
  baseURL: BASE_URL,
  fetch: createAuthorizedFetch(),
});

// Function to create provider with current selected model
const createDynamicProvider = () => {
  const selectedModel = ModelStateStore.getState().selectedModel;

  return customProvider({
    languageModels: {
      'chat-model': openai(selectedModel.name),
      'chat-model-reasoning': wrapLanguageModel({
        model: openai('gpt-4o-mini'),
        middleware: extractReasoningMiddleware({ tagName: 'think' }),
      }),
      'title-model': openai('gpt-4o-mini'),
      'artifact-model': openai(selectedModel.name),
    },
    imageModels: {
      'small-model': openai.image('gpt-4o-mini'),
    },
  });
};

// Export a provider that dynamically resolves models
export const myProvider = {
  languageModel: (modelName: string) => {
    const provider = createDynamicProvider();
    return provider.languageModel(modelName);
  },
  imageModel: (modelName: string) => {
    const provider = createDynamicProvider();
    return provider.imageModel(modelName);
  },
};
