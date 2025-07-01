// model-store.ts
// Store for managing model selection and favorites

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NuwaIdentityKit } from '@/features/auth/services';
import { createPersistConfig, db } from '@/storage';
import type { Model } from '../types';

// default selected model
export const DEFAULT_SELECTED_MODEL: Model = {
  name: 'gpt-4o-mini',
  provider: 'openai',
  model_slug: 'gpt-4o-mini',
  mode: 'chat',
  max: {
    tokens: 16384,
    input_tokens: 128000,
    output_tokens: 16384,
  },
  cost: {
    input_cost_per_million_token: 0.15,
    output_cost_per_million_token: 0.6,
  },
  supports: {
    system_messages: true,
    response_schema: true,
    vision: true,
    function_calling: true,
    tool_choice: true,
    assistant_prefill: null,
    prompt_caching: true,
    audio_input: null,
    audio_output: null,
    pdf_input: true,
    embedding_image_input: null,
    native_streaming: null,
    web_search: null,
    url_context: null,
    reasoning: null,
    computer_use: null,
    openai_params: [
      'frequency_penalty',
      'logit_bias',
      'logprobs',
      'top_logprobs',
      'max_tokens',
      'max_completion_tokens',
      'modalities',
      'prediction',
      'n',
      'presence_penalty',
      'seed',
      'stop',
      'stream',
      'stream_options',
      'temperature',
      'top_p',
      'tools',
      'tool_choice',
      'function_call',
      'functions',
      'max_retries',
      'extra_headers',
      'parallel_tool_calls',
      'audio',
      'web_search_options',
      'response_format',
      'user',
    ],
  },
};

// get current DID
const getCurrentDID = async () => {
  const { getDid } = await NuwaIdentityKit();
  return await getDid();
};

const modelDB = db;

// model store state interface
interface ModelStateStoreState {
  // model selection state
  selectedModel: Model;
  setSelectedModel: (model: Model) => void;

  // favorites state
  favoriteModels: Model[];
  addToFavorites: (model: Model) => void;
  removeFromFavorites: (modelSlug: string) => void;

  // data persistence
  loadFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
}

// persist configuration
const persistConfig = createPersistConfig<ModelStateStoreState>({
  name: 'model-storage',
  getCurrentDID: getCurrentDID,
  partialize: (state) => ({
    selectedModel: state.selectedModel,
    favoriteModels: state.favoriteModels,
  }),
  onRehydrateStorage: () => (state) => {
    if (state) {
      state.loadFromDB();
    }
  },
});

// model store factory
export const ModelStateStore = create<ModelStateStoreState>()(
  persist(
    (set, get) => ({
      selectedModel: DEFAULT_SELECTED_MODEL,
      favoriteModels: [],

      setSelectedModel: (model: Model) => {
        set({ selectedModel: model });
        get().saveToDB();
      },

      addToFavorites: (model: Model) => {
        set((state) => {
          // avoid duplicates
          const isAlreadyFavorite = state.favoriteModels.some(
            (fav) => fav.model_slug === model.model_slug,
          );
          if (isAlreadyFavorite) return state;

          return {
            favoriteModels: [...state.favoriteModels, model],
          };
        });
        get().saveToDB();
      },

      removeFromFavorites: (modelSlug: string) => {
        set((state) => ({
          favoriteModels: state.favoriteModels.filter(
            (model) => model.model_slug !== modelSlug,
          ),
        }));
        get().saveToDB();
      },

      loadFromDB: async () => {
        if (typeof window === 'undefined') return;
        try {
          const currentDID = await getCurrentDID();
          if (!currentDID) return;
          const record = await modelDB.models
            .where('did')
            .equals(currentDID)
            .first();
          if (record) {
            set({
              selectedModel: record.selectedModel,
              favoriteModels: record.favoriteModels,
            });
          }
        } catch (error) {
          console.error('Failed to load model store from DB:', error);
        }
      },

      saveToDB: async () => {
        if (typeof window === 'undefined') return;
        try {
          const currentDID = await getCurrentDID();
          if (!currentDID) return;
          const { selectedModel, favoriteModels } = get();
          await modelDB.models.put({
            did: currentDID,
            selectedModel,
            favoriteModels,
          });
        } catch (error) {
          console.error('Failed to save model store to DB:', error);
        }
      },
    }),
    persistConfig,
  ),
);
