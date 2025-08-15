// stores.ts
// Central export for all cap-dev stores

import { create } from 'zustand';
import type { CapModel } from '@/shared/types/cap';
import { fetchModels } from '../services';

export const DefaultModel: CapModel = {
  id: 'openai/gpt-4o-mini',
  name: ' GPT-4o-mini',
  slug: 'gpt-4o-mini',
  providerName: 'OpenAI',
  providerSlug: 'openai',
  description:
    "GPT-4o mini is OpenAI's newest model after [GPT-4 Omni](/models/openai/gpt-4o), supporting both text and image inputs with text outputs.\n\nAs their most advanced small model, it is many multiples more affordable than other recent frontier models, and more than 60% cheaper than [GPT-3.5 Turbo](/models/openai/gpt-3.5-turbo). It maintains SOTA intelligence, while being significantly more cost-effective.\n\nGPT-4o mini achieves an 82% score on MMLU and presently ranks higher than GPT-4 on chat preferences [common leaderboards](https://arena.lmsys.org/).\n\nCheck out the [launch announcement](https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/) to learn more.\n\n#multimodal",
  contextLength: 128000,
  pricing: {
    input_per_million_tokens: 0.15,
    output_per_million_tokens: 0.6,
    request_per_k_requests: 0,
    image_per_k_images: 0.217,
    web_search_per_k_searches: 0,
  },
  supported_inputs: ['text', 'image', 'file'],
  supported_parameters: [
    'max_tokens',
    'temperature',
    'top_p',
    'stop',
    'frequency_penalty',
    'presence_penalty',
    'web_search_options',
    'seed',
    'logit_bias',
    'logprobs',
    'top_logprobs',
    'response_format',
    'structured_outputs',
    'tools',
    'tool_choice',
  ],
};

// model store state interface
interface ModelStateStoreState {
  // model selection state
  selectedModel: CapModel;
  setSelectedModel: (model: CapModel) => void;

  // available models state
  availableModels: CapModel[] | null;
  isLoadingModels: boolean;
  modelsError: Error | null;
  fetchAvailableModels: () => Promise<void>;
  reloadModels: () => Promise<void>;
}

// model store factory
export const ModelStateStore = create<ModelStateStoreState>()((set, get) => ({
  selectedModel: DefaultModel,

  // available models state
  availableModels: null,
  isLoadingModels: false,
  modelsError: null,

  setSelectedModel: (model: CapModel) => {
    set({ selectedModel: model });
  },

  // fetch available models
  fetchAvailableModels: async () => {
    const { availableModels, isLoadingModels } = get();

    // if there is cached data and not loading, return
    if (availableModels && !isLoadingModels) {
      return;
    }

    // if loading, wait for completion
    if (isLoadingModels) {
      return;
    }

    set({ isLoadingModels: true, modelsError: null });

    try {
      const models = await fetchModels();
      set({
        availableModels: models,
        isLoadingModels: false,
        modelsError: null,
      });
    } catch (error) {
      set({
        modelsError: error as Error,
        isLoadingModels: false,
      });
    }
  },

  // reload models (force refresh)
  reloadModels: async () => {
    set({ isLoadingModels: true, modelsError: null });

    try {
      const models = await fetchModels();
      set({
        availableModels: models,
        isLoadingModels: false,
        modelsError: null,
      });
    } catch (error) {
      set({
        modelsError: error as Error,
        isLoadingModels: false,
      });
    }
  },
}));
