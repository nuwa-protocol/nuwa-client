import type { Cap } from '../types/cap';

export const CapContractAddress = '0xeb1deb6f1190f86cd4e05a82cfa5775a8a5929da49fac3ab8f5bf23e9181e625'

export const predefinedTags = [
  'AI Model',
  'Coding',
  'Content Writing',
  'Research',
  'Crypto',
  'Tools',
  'Others',
];

export const promptVariables = [
  {
    name: '{{user_geo}}',
    description: "The user's location",
    value: `The user's location is {{user_geo}}`,
  },
];

export const defaultCap: Cap = {
  id: '1',
  authorDID: 'default',
  idName: 'default-cap',
  core: {
    prompt: {
      value: 'You are a helpful AI assistant',
      suggestions: [],
    },
    model: {
      id: 'openai/chatgpt-4o-latest',
      name: ' ChatGPT-4o',
      slug: 'chatgpt-4o-latest',
      providerName: 'OpenAI',
      providerSlug: 'openai',
      description:
        'OpenAI ChatGPT 4o is continually updated by OpenAI to point to the current version of GPT-4o used by ChatGPT. It therefore differs slightly from the API version of [GPT-4o](/models/openai/gpt-4o) in that it has additional RLHF. It is intended for research and evaluation.\n\nOpenAI notes that this model is not suited for production use-cases as it may be removed or redirected to another model in the future.',
      contextLength: 128000,
      pricing: {
        input_per_million_tokens: 5,
        output_per_million_tokens: 15,
        request_per_k_requests: 0,
        image_per_k_images: 7.225,
        web_search_per_k_searches: 0,
      },
      supported_inputs: ['text', 'image'],
      supported_parameters: [
        'frequency_penalty',
        'logit_bias',
        'logprobs',
        'max_tokens',
        'presence_penalty',
        'response_format',
        'seed',
        'stop',
        'structured_outputs',
        'temperature',
        'top_logprobs',
        'top_p',
      ],
    },
    mcpServers: {},
  },
  metadata: {
    displayName: 'ChatGPT-4o',
    description:
      'OpenAI ChatGPT 4o is continually updated by OpenAI to point to the current version of GPT-4o used by ChatGPT. It therefore differs slightly from the API version of [GPT-4o](/models/openai/gpt-4o) in that it has additional RLHF. It is intended for research and evaluation.\n\nOpenAI notes that this model is not suited for production use-cases as it may be removed or redirected to another model in the future.',
    tags: ['ai', 'chatbot', 'openai'],
    submittedAt: 0,
    thumbnail: {
      type: 'url',
      url: 'https://unpkg.com/@lobehub/icons-static-png@1.60.0/light/openai.png',
    },
  },
};
