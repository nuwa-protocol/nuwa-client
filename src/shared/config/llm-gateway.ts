// Centralized LLM Gateway configuration for reuse across features
import { LLM_GATEWAY_HOST } from './network';

export const LLM_GATEWAY = LLM_GATEWAY_HOST;
export const LLM_GATEWAY_BASE_URL = `${LLM_GATEWAY}/openrouter/api/v1`;
