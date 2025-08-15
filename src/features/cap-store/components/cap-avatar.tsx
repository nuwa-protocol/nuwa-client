import { useTheme } from '@/shared/components/theme-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui';
import type { CapThumbnail } from '@/shared/types/cap';

const sizeClasses = {
  sm: 'size-6', // 24px
  md: 'size-8', // 32px
  lg: 'size-10', // 40px
  xl: 'size-12', // 48px
} as const;

export function CapAvatar({
  capName,
  capThumbnail,
  size = 'md',
}: {
  capName: string;
  capThumbnail: CapThumbnail;
  size?: keyof typeof sizeClasses;
}) {
  const sizeClass = sizeClasses[size] || sizeClasses['md'];

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Avatar
      className={`${sizeClass} shrink-0 rounded-sm ${isDark ? 'bg-foreground' : 'bg-background'}`}
    >
      <AvatarImage
        src={
          capThumbnail?.type === 'file'
            ? capThumbnail.file
            : capThumbnail?.url || `https://avatar.vercel.sh/${capName}`
        }
        alt={capName}
        className="object-cover"
      />
      <AvatarFallback className="text-xs">
        {capName.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
