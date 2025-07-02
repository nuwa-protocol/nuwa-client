import { ModelStateStore } from '../../stores/model-store';
import { createAuthorizedFetch } from './fetch';
import { createLitellm } from './litellm-provider';

export type ModelType = 'title-model' | 'artifact-model' | 'chat-model';
const BASE_URL = 'https://test-llm.nuwa.dev/api/v1';

const litellmProvider = createLitellm({
  name: 'litellm',
  baseURL: BASE_URL,
  fetch: createAuthorizedFetch(),
});

// Export a provider that dynamically resolves models
export const myProvider = {
  languageModel: (modelType: ModelType) => {
    const selectedModel = ModelStateStore.getState().selectedModel;

    switch (modelType) {
      case 'title-model':
        return litellmProvider('deepseek/deepseek-chat-v3-0324:free');
      case 'artifact-model':
        return litellmProvider(selectedModel.name);
      case 'chat-model':
        return litellmProvider(selectedModel.name);
      default:
        return litellmProvider(selectedModel.name);
    }
  },
  imageModel: () => {
    const selectedModel = ModelStateStore.getState().selectedModel;
    return litellmProvider.imageModel(selectedModel.name);
  },
};
