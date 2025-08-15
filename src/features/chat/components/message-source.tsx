import { LinkIcon } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/shared/utils';
import { MessageSourceSidebar } from './message-source-sidebar';

interface MessageSourceProps {
  sources: Array<{
    id?: string;
    title?: string;
    url?: string;
  }>;
  className?: string;
}

export const MessageSource = ({ sources, className }: MessageSourceProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (sources.length === 0) {
    return null;
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className={cn('w-full', className)}>
      <button
        type="button"
        onClick={handleButtonClick}
        className="group flex items-center gap-2 py-2 px-1 hover:bg-accent transition-all duration-200 rounded-md border border-transparent hover:border-border/50"
      >
        <LinkIcon className="w-3.5 h-3.5 text-muted-foreground/70 group-hover:text-muted-foreground transition-colors" />
        <span className="text-xs text-muted-foreground/70 group-hover:text-muted-foreground transition-colors font-medium">
          {sources.length} source{sources.length !== 1 ? 's' : ''}
        </span>
      </button>

      <MessageSourceSidebar
        sources={sources}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      />
    </div>
  );
};
