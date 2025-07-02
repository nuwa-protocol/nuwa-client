import {
  EmbeddingModelV1,
  ImageModelV1,
  LanguageModelV1,
  ProviderV1,
} from '@ai-sdk/provider';
import { FetchFunction, withoutTrailingSlash } from '@ai-sdk/provider-utils';
import { LitellmChatLanguageModel } from './litellm-chat-language-model';
import { LitellmChatSettings } from './litellm-chat-settings';
import { LitellmCompletionLanguageModel } from './litellm-completion-language-model';
import { LitellmCompletionSettings } from './litellm-completion-settings';
import { LitellmEmbeddingModel } from './litellm-embedding-model';
import { LitellmEmbeddingSettings } from './litellm-embedding-settings';
import { LitellmImageModel } from './litellm-image-model';
import { LitellmImageSettings } from './litellm-image-settings';

export interface LitellmProvider<
  CHAT_MODEL_IDS extends string = string,
  COMPLETION_MODEL_IDS extends string = string,
  EMBEDDING_MODEL_IDS extends string = string,
  IMAGE_MODEL_IDS extends string = string,
> extends Omit<ProviderV1, 'imageModel'> {
  (modelId: CHAT_MODEL_IDS, settings?: LitellmChatSettings): LanguageModelV1;

  languageModel(
    modelId: CHAT_MODEL_IDS,
    settings?: LitellmChatSettings,
  ): LanguageModelV1;

  chatModel(
    modelId: CHAT_MODEL_IDS,
    settings?: LitellmChatSettings,
  ): LanguageModelV1;

  completionModel(
    modelId: COMPLETION_MODEL_IDS,
    settings?: LitellmCompletionSettings,
  ): LanguageModelV1;

  textEmbeddingModel(
    modelId: EMBEDDING_MODEL_IDS,
    settings?: LitellmEmbeddingSettings,
  ): EmbeddingModelV1<string>;

  imageModel(
    modelId: IMAGE_MODEL_IDS,
    settings?: LitellmImageSettings,
  ): ImageModelV1;
}

export interface LitellmProviderSettings {
  /**
Base URL for the API calls.
   */
  baseURL: string;

  /**
Provider name.
   */
  name: string;

  /**
API key for authenticating requests. If specified, adds an `Authorization`
header to request headers with the value `Bearer <apiKey>`. This will be added
before any headers potentially specified in the `headers` option.
   */
  apiKey?: string;

  /**
Optional custom headers to include in requests. These will be added to request headers
after any headers potentially added by use of the `apiKey` option.
   */
  headers?: Record<string, string>;

  /**
Optional custom url query parameters to include in request urls.
   */
  queryParams?: Record<string, string>;

  /**
Custom fetch implementation. You can use it as a middleware to intercept requests,
or to provide a custom fetch implementation for e.g. testing.
   */
  fetch?: FetchFunction;
}

/**
Create an Litellm provider instance.
 */
export function createLitellm<
  CHAT_MODEL_IDS extends string,
  COMPLETION_MODEL_IDS extends string,
  EMBEDDING_MODEL_IDS extends string,
  IMAGE_MODEL_IDS extends string,
>(
  options: LitellmProviderSettings,
): LitellmProvider<
  CHAT_MODEL_IDS,
  COMPLETION_MODEL_IDS,
  EMBEDDING_MODEL_IDS,
  IMAGE_MODEL_IDS
> {
  const baseURL = withoutTrailingSlash(options.baseURL);
  const providerName = options.name;

  interface CommonModelConfig {
    provider: string;
    url: ({ path }: { path: string }) => string;
    headers: () => Record<string, string>;
    fetch?: FetchFunction;
  }

  const getHeaders = () => ({
    ...(options.apiKey && { Authorization: `Bearer ${options.apiKey}` }),
    ...options.headers,
  });

  const getCommonModelConfig = (modelType: string): CommonModelConfig => ({
    provider: `${providerName}.${modelType}`,
    url: ({ path }) => {
      const url = new URL(`${baseURL}${path}`);
      if (options.queryParams) {
        url.search = new URLSearchParams(options.queryParams).toString();
      }
      return url.toString();
    },
    headers: getHeaders,
    fetch: options.fetch,
  });

  const createLanguageModel = (
    modelId: CHAT_MODEL_IDS,
    settings: LitellmChatSettings = {},
  ) => createChatModel(modelId, settings);

  const createChatModel = (
    modelId: CHAT_MODEL_IDS,
    settings: LitellmChatSettings = {},
  ) =>
    new LitellmChatLanguageModel(modelId, settings, {
      ...getCommonModelConfig('chat'),
      defaultObjectGenerationMode: 'tool',
    });

  const createCompletionModel = (
    modelId: COMPLETION_MODEL_IDS,
    settings: LitellmCompletionSettings = {},
  ) =>
    new LitellmCompletionLanguageModel(
      modelId,
      settings,
      getCommonModelConfig('completion'),
    );

  const createEmbeddingModel = (
    modelId: EMBEDDING_MODEL_IDS,
    settings: LitellmEmbeddingSettings = {},
  ) =>
    new LitellmEmbeddingModel(
      modelId,
      settings,
      getCommonModelConfig('embedding'),
    );

  const createImageModel = (
    modelId: IMAGE_MODEL_IDS,
    settings: LitellmImageSettings = {},
  ) => new LitellmImageModel(modelId, settings, getCommonModelConfig('image'));

  const provider = (modelId: CHAT_MODEL_IDS, settings?: LitellmChatSettings) =>
    createLanguageModel(modelId, settings);

  provider.languageModel = createLanguageModel;
  provider.chatModel = createChatModel;
  provider.completionModel = createCompletionModel;
  provider.textEmbeddingModel = createEmbeddingModel;
  provider.imageModel = createImageModel;

  return provider as LitellmProvider<
    CHAT_MODEL_IDS,
    COMPLETION_MODEL_IDS,
    EMBEDDING_MODEL_IDS,
    IMAGE_MODEL_IDS
  >;
}
