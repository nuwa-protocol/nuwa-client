// This file is kept for potential future model functionality
// Currently no model selection is needed

import type {
  AvailableProviders,
  LitellmModelAPIResponse,
  Model,
} from '../../types';
import { createAuthorizedFetch } from './fetch';

function mapLitellmResponseToModels(
  response: LitellmModelAPIResponse,
): Model[] {
  return response.data.map((item) => {
    const name = item.model_name;
    const provider = item.litellm_params.custom_llm_provider;
    const id = `${provider}>${name}` as `${AvailableProviders}>${string}`;
    return {
      id,
      name,
      provider,
      model_slug: item.model_info.id,
      mode: item.model_info.mode,
      max: {
        totalTokens: item.model_info.max_tokens ?? null,
        inputTokens: item.model_info.max_input_tokens ?? null,
        outputTokens: item.model_info.max_output_tokens ?? null,
      },
      cost: {
        inputPerMillionTokens: item.model_info.input_cost_per_token
          ? item.model_info.input_cost_per_token * 1000000
          : null,
        outputPerMillionTokens: item.model_info.output_cost_per_token
          ? item.model_info.output_cost_per_token * 1000000
          : null,
      },
      supports: {
        system_messages: item.model_info.supports_system_messages ?? null,
        response_schema: item.model_info.supports_response_schema ?? null,
        vision: item.model_info.supports_vision ?? null,
        function_calling: item.model_info.supports_function_calling ?? null,
        tool_choice: item.model_info.supports_tool_choice ?? null,
        assistant_prefill: item.model_info.supports_assistant_prefill ?? null,
        prompt_caching: item.model_info.supports_prompt_caching ?? null,
        audio_input: item.model_info.supports_audio_input ?? null,
        audio_output: item.model_info.supports_audio_output ?? null,
        pdf_input: item.model_info.supports_pdf_input ?? null,
        embedding_image_input:
          item.model_info.supports_embedding_image_input ?? null,
        native_streaming: item.model_info.supports_native_streaming ?? null,
        web_search: item.model_info.supports_web_search ?? null,
        url_context: item.model_info.supports_url_context ?? null,
        reasoning: item.model_info.supports_reasoning ?? null,
        computer_use: item.model_info.supports_computer_use ?? null,
        openai_params: item.model_info.supported_openai_params ?? [],
      },
    };
  });
}

/**
 * Fetches the list of available models from OpenRouter API.
 * @returns {Promise<Model[]>} The list of available models.
 */
export async function fetchAvailableModels(): Promise<Model[]> {
  const authorizedFetch = createAuthorizedFetch();
  const endpoint = 'https://test-llm.nuwa.dev/api/v1/model/info';

  try {
    const response = await authorizedFetch(endpoint, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch models: ${response.status} ${response.statusText}`,
      );
    }
    const data: LitellmModelAPIResponse = await response.json();
    return mapLitellmResponseToModels(data);
  } catch (error) {
    console.error('Error fetching available models:', error);
    throw error;
  }
}
