import { ModelStateStore } from '../../stores/model-store';
import { providerRegistry } from './provider';

export type ModelType = 'title-model' | 'artifact-model' | 'chat-model';

// Export a provider that dynamically resolves models
export const myProvider = {
  languageModel: (modelType: ModelType) => {
    const selectedModel = ModelStateStore.getState().selectedModel;
    switch (modelType) {
      case 'title-model':
        return providerRegistry.languageModel('openai>gpt-4o-mini');
      case 'artifact-model':
        return providerRegistry.languageModel(selectedModel.id);
      case 'chat-model':
        return providerRegistry.languageModel(selectedModel.id);
      default:
        return providerRegistry.languageModel(selectedModel.id);
    }
  },
  imageModel: () => {
    const selectedModel = ModelStateStore.getState().selectedModel;
    return providerRegistry.imageModel(selectedModel.id);
  },
};
