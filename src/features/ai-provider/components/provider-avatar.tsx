import {
  Ai21,
  Alibaba,
  Anthropic,
  Baidu,
  Claude,
  Cohere,
  DeepSeek,
  Fireworks,
  Google,
  Grok,
  Groq,
  HuggingFace,
  Inflection,
  Meta,
  Microsoft,
  Minimax,
  Mistral,
  Moonshot,
  NousResearch,
  Nvidia,
  OpenAI,
  OpenRouter,
  Perplexity,
  Qwen,
  Replicate,
  Tencent,
  Together,
  Zhipu,
} from '@lobehub/icons';
import { BotIcon } from 'lucide-react';
import React from 'react';

interface ProviderAvatarProps {
  provider: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'size-5',
  md: 'size-8',
  lg: 'size-12',
};

const iconSizeMap = {
  sm: 20,
  md: 32,
  lg: 48,
};

const AutoIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="none"
    viewBox="0 0 16 16"
  >
    <path
      fill="currentColor"
      d="m3.5 8.5.849 2.152L6.5 11.5l-2.151.848L3.5 14.5l-.849-2.152L.5 11.5l2.151-.848L3.5 8.5Z"
    />
    <path stroke="currentColor" d="M1 4.5h2.5l7 7h4M14.5 4.5h-4L9 6" />
    <path stroke="currentColor" d="m12 2 2.5 2.5L12 7M12 9l2.5 2.5L12 14" />
  </svg>
);

// Provider名称到图标组件的映射
const PROVIDER_ICON_MAP: Record<
  string,
  React.ComponentType<{ size?: number }> & {
    Color?: React.ComponentType<{ size?: number }>;
  }
> = {
  openai: OpenAI,
  anthropic: Anthropic,
  google: Google,
  meta: Meta,
  mistral: Mistral,
  cohere: Cohere,
  perplexity: Perplexity,
  'x-ai': Grok,
  xai: Grok,
  deepseek: DeepSeek,
  qwen: Qwen,
  claude: Claude,
  gpt: OpenAI,
  chatgpt: OpenAI,
  gemini: Google,
  llama: Meta,
  zhipu: Zhipu,
  moonshot: Moonshot,
  baidu: Baidu,
  alibaba: Alibaba,
  tencent: Tencent,
  huggingface: HuggingFace,
  together: Together,
  fireworks: Fireworks,
  groq: Groq,
  replicate: Replicate,
  openrouter: OpenRouter,
  microsoft: Microsoft,
  nvidia: Nvidia,
  ai21: Ai21,
  minimax: Minimax,
  inflection: Inflection,
  nous: NousResearch,
  nousresearch: NousResearch,
  'meta-llama': Meta,
  '01.ai': Qwen,
  moonshotai: Moonshot,
  thudm: Zhipu,
  mistralai: Mistral,
  amazon: Alibaba,
  liquid: DeepSeek,
};

export const ProviderAvatar: React.FC<ProviderAvatarProps> = ({
  provider,
  size = 'md',
  className = '',
}) => {
  // 标准化provider名称
  const normalizedProvider = provider.toLowerCase().replace(/\s+/g, '-');

  const iconSize = iconSizeMap[size];

  // 如果 provider 是 auto，渲染 AutoIcon 并加上主色
  if (normalizedProvider === 'auto') {
    return (
      <div
        className={`${sizeMap[size]} ${className} flex items-center justify-center`}
        style={{ color: 'var(--primary)' }} // 你可以根据主题调整
      >
        {React.cloneElement(AutoIcon, {
          width: iconSize,
          height: iconSize,
          className: 'text-primary',
        })}
      </div>
    );
  }

  // 查找对应的图标组件
  const IconComponent = PROVIDER_ICON_MAP[normalizedProvider];

  // 如果有对应的图标组件，使用它
  if (IconComponent) {
    try {
      // 优先使用彩色图标，如果不存在则使用默认图标
      const ColorIcon = (IconComponent as any).Color;
      const FinalIcon = ColorIcon || IconComponent;

      return (
        <div
          className={`${sizeMap[size]} ${className} flex items-center justify-center`}
        >
          <FinalIcon size={iconSize} />
        </div>
      );
    } catch (error) {
      // 如果图标组件渲染失败，回退到默认图标
      console.warn(`Failed to render icon for provider: ${provider}`, error);
    }
  }

  // 回退到BotIcon
  return <BotIcon className={`${sizeMap[size]} ${className}`} />;
};
