import { createAuthorizedFetch } from '@/shared/services/authorized-fetch';
import type {
  ModelDetails,
  OpenRouterAPIResponse,
  OpenRouterModel,
} from '../components/cap-edit/model/model-selector/type';

async function modelFetch(gatewayUrl: string): Promise<OpenRouterAPIResponse> {
  const authorizedFetch = createAuthorizedFetch();
  // const endpoint = `${gatewayUrl}/models`;
  const endpoint = `https://openrouter.ai/api/v1/models`;

  try {
    const response = await authorizedFetch(endpoint, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch models: ${response.status} ${response.statusText}`,
      );
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching available models:', error);
    throw error;
  }
}

function detectToolSupport(model: OpenRouterModel): boolean {
  // Check if the model supports function calling based on supported parameters
  const toolSupportParams = [
    'tools', 
    'tool_choice', 
    'function_call', 
    'functions',
    'parallel_tool_calls'
  ];
  
  const hasToolParams = model.supported_parameters.some(param => 
    toolSupportParams.includes(param.toLowerCase())
  ); 
  
  return hasToolParams;
}

function parseModelInfo(model: OpenRouterModel) {
  const id = model.id;
  const baseId = model.id.split(':')[0];
  const [providerSlug, ...slugParts] = baseId.split('/');
  const slug = slugParts.join('/');

  let providerName = '';
  let name = '';
  if (model.name.includes(':')) {
    [providerName, name] = model.name.split(':');
    providerName = providerName.trim();
  } else {
    name = model.name;
    providerName = providerSlug;
  }

  return {
    id,
    name,
    slug,
    providerName,
    providerSlug,
  };
}

export async function fetchModels(gatewayUrl: string): Promise<ModelDetails[]> {
  const openRouterModels = await modelFetch(gatewayUrl);

  return openRouterModels.data
    .filter((model: OpenRouterModel) => !model.id.includes('openrouter')) // exclude openrouter models
    .map((model: OpenRouterModel) => {
      return {
        ...parseModelInfo(model),
        description: model.description,
        contextLength: model.context_length,
        pricing: {
          input_per_million_tokens: parseFloat(model.pricing.prompt) * 1000000,
          output_per_million_tokens:
            parseFloat(model.pricing.completion) * 1000000,
          request_per_k_requests: parseFloat(model.pricing.request) * 1000,
          image_per_k_images: parseFloat(model.pricing.image) * 1000,
          web_search_per_k_searches:
            parseFloat(model.pricing.web_search) * 1000,
        },
        supported_inputs: model.architecture.input_modalities,
        supported_parameters: model.supported_parameters,
        supports_tools: detectToolSupport(model),
      };
    });
}
