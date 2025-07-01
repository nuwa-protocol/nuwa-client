import type { Message } from 'ai';

// client chat interface
export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

// stream ID management interface
export interface StreamRecord {
  id: string;
  chatId: string;
  createdAt: number;
}

export interface LitellmModelAPIResponse {
  data: Array<{
    model_name: string;
    litellm_params: {
      custom_llm_provider: string;
      litellm_credential_name: string;
      use_in_pass_through: boolean;
      use_litellm_proxy: boolean;
      merge_reasoning_content_in_choices: boolean;
      model: string;
    };
    model_info: {
      id: string;
      db_model: boolean;
      key: string;
      max_tokens: number;
      max_input_tokens: number;
      max_output_tokens: number | null;
      input_cost_per_token: number;
      cache_creation_input_token_cost: number | null;
      cache_read_input_token_cost: number | null;
      input_cost_per_character: number | null;
      input_cost_per_token_above_128k_tokens: number | null;
      input_cost_per_token_above_200k_tokens: number | null;
      input_cost_per_query: number | null;
      input_cost_per_second: number | null;
      input_cost_per_audio_token: number | null;
      input_cost_per_token_batches: number | null;
      output_cost_per_token_batches: number | null;
      output_cost_per_token: number;
      output_cost_per_audio_token: number | null;
      output_cost_per_character: number | null;
      output_cost_per_reasoning_token: number | null;
      output_cost_per_token_above_128k_tokens: number | null;
      output_vector_size: number | null;
      citation_cost_per_token: number | null;
      litellm_provider: string;
      mode: string;
      supports_system_messages: boolean | null;
      supports_response_schema: boolean | null;
      supports_vision: boolean | null;
      supports_function_calling: boolean | null;
      supports_tool_choice: boolean | null;
      supports_assistant_prefill: boolean | null;
      supports_prompt_caching: boolean | null;
      supports_audio_input: boolean | null;
      supports_audio_output: boolean | null;
      supports_pdf_input: boolean | null;
      supports_embedding_image_input: boolean | null;
      supports_native_streaming: boolean | null;
      supports_web_search: boolean;
      supports_url_context: boolean | null;
      supports_reasoning: boolean;
      supports_computer_use: boolean | null;
      search_context_cost_per_query: {
        search_context_size_low: number;
        search_context_size_medium: number;
        search_context_size_high: number;
      };
      tpm: number | null;
      rpm: number | null;
      supported_openai_params: string[];
    };
  }>;
}

export interface Model {
  name: string;
  provider: string;
  model_slug: string;
  mode: string;
  max: {
    tokens: number | null;
    input_tokens: number | null;
    output_tokens: number | null;
  };
  cost: {
    input_cost_per_million_token: number | null;
    output_cost_per_million_token: number | null;
  };
  supports: {
    system_messages: boolean | null;
    response_schema: boolean | null;
    vision: boolean | null;
    function_calling: boolean | null;
    tool_choice: boolean | null;
    assistant_prefill: boolean | null;
    prompt_caching: boolean | null;
    audio_input: boolean | null;
    audio_output: boolean | null;
    pdf_input: boolean | null;
    embedding_image_input: boolean | null;
    native_streaming: boolean | null;
    web_search: boolean | null;
    url_context: boolean | null;
    reasoning: boolean | null;
    computer_use: boolean | null;
    openai_params: string[];
  };
}

// export interface OpenRouterModel {
//   id: string;
//   name: string;
//   created: number;
//   description: string;
//   architecture: {
//     modality?: string | null;
//     input_modalities: string[];
//     output_modalities: string[];
//     tokenizer: string;
//     instruct_type?: string | null;
//   };
//   top_provider: {
//     is_moderated: boolean;
//     context_length?: number;
//     max_completion_tokens?: number;
//   };
//   pricing: {
//     prompt: string;
//     completion: string;
//     image: string;
//     request: string;
//     web_search: string;
//     internal_reasoning: string;
//     input_cache_read?: string;
//   };
//   canonical_slug: string;
//   context_length: number;
//   hugging_face_id: string | null;
//   per_request_limits?: Record<string, any> | null;
//   supported_parameters: string[];
// }

// export interface OpenRouterModelsAPIResponse {
//   data: OpenRouterModel[];
// }
