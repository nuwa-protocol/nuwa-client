import { BotIcon } from 'lucide-react';
import React from 'react';
import { Img } from 'react-image';
import { useTheme } from '@/shared/components/theme-provider';

interface ModelAvatarProps {
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
  sm: 'size-5',
  md: 'size-8',
  lg: 'size-12',
};



export const ModelAvatar: React.FC<ModelAvatarProps> = ({
  provider,
  size = 'md',
  className = ''
}) => {

  const { resolvedTheme } = useTheme();
  const iconSlug = provider;
  const iconSrc = `https://unpkg.com/@lobehub/icons-static-webp@latest/${resolvedTheme}/${iconSlug}-color.webp`
  const iconSrcBw = `https://unpkg.com/@lobehub/icons-static-webp@latest/${resolvedTheme}/${iconSlug}.webp`
  return (
    <Img
      src={[iconSrc, iconSrcBw]}
      className={`${sizeMap[size]} ${className}`}
      loading="lazy"
      loader={<BotIcon className={`${iconSizeMap[size]}`} />}
      unloader={<BotIcon className={`${iconSizeMap[size]}`} />}
    />
  );
};