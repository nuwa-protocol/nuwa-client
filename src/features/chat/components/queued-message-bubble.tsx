import { XIcon } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import type { QueuedMessage } from '../hooks/use-message-queue';

interface QueuedMessageBubbleProps {
  queue: QueuedMessage[];
  onRemoveMessage: (messageId: string) => void;
  onClearQueue: () => void;
}

export function QueuedMessageBubble({
  queue,
  onRemoveMessage,
  onClearQueue,
}: QueuedMessageBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (queue.length === 0) {
    return null;
  }

  const firstMessage = queue[0];
  const hasMultiple = queue.length > 1;

  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <div className="flex bg-purple-200 dark:bg-purple-700 px-3 py-2 rounded-xl items-center gap-2 bg-muted border cursor-pointer hover:bg-muted/80 transition-colors max-w-xs">
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">
                  {firstMessage.text ||
                    (firstMessage.files?.length
                      ? `${firstMessage.files.length} file(s)`
                      : 'Empty message')}
                </div>
                {firstMessage.files &&
                  firstMessage.files.length > 0 &&
                  firstMessage.text && (
                    <div className="text-xs text-muted-foreground mt-1">
                      +{firstMessage.files.length} attachment(s)
                    </div>
                  )}
              </div>
              {hasMultiple && (
                <Badge className="rounded-full size-6 text-xs items-center justify-center">
                  {queue.length}
                </Badge>
              )}
            </div>
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0" align="end" side="top">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                Queued Messages ({queue.length})
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearQueue}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear All
              </Button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {queue.map((message, index) => (
              <div
                key={message.id}
                className="group p-3 hover:bg-muted/50 transition-colors border-b last:border-b-0"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">
                      #{index + 1} •{' '}
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-sm break-words">
                      {message.text ||
                        (message.files?.length
                          ? `${message.files.length} file(s)`
                          : 'Empty message')}
                    </div>
                    {message.files &&
                      message.files.length > 0 &&
                      message.text && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {message.files
                            .map((file) => file.filename || 'Unknown file')
                            .join(', ')}
                        </div>
                      )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveMessage(message.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-fit"
                  >
                    <XIcon size={12} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
