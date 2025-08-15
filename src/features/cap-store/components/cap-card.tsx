import { Loader2, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import {
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui';
import type { Cap } from '@/shared/types/cap';
import { useCapStore } from '../hooks/use-cap-store';
import type { RemoteCap } from '../types';
import { CapAvatar } from './cap-avatar';
import { useCapStoreModal } from './cap-store-modal-context';

interface CapCardActions {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export interface CapCardProps {
  cap: Cap | RemoteCap;
  actions?: CapCardActions[];
}

export function CapCard({ cap, actions }: CapCardProps) {
  const { runCap } = useCapStore();
  const { closeModal } = useCapStoreModal();
  const [isLoading, setIsLoading] = useState(false);

  const handleCapClick = async (cap: Cap | RemoteCap) => {
    setIsLoading(true);
    try {
      const isRemoteCap = 'cid' in cap;
      if (isRemoteCap) {
        await runCap(cap.id, cap.cid);
      } else {
        await runCap(cap.id);
      }
      closeModal();
    } finally {
      setIsLoading(false);
    }
  };

  const capMetadata = cap.metadata;
  return (
    <Card
      className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${isLoading ? 'opacity-75 pointer-events-none' : ''}`}
      onClick={() => handleCapClick(cap)}
    >
      <div className="flex items-center gap-3">
        <CapAvatar
          capName={capMetadata.displayName}
          capThumbnail={capMetadata.thumbnail}
          size="xl"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">
            {capMetadata.displayName}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {capMetadata.description}
          </p>
        </div>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1.5 hover:bg-muted rounded-sm transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">More Actions</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {actions?.map((action) => (
                <DropdownMenuItem
                  key={action.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => e.stopPropagation()}
                  onSelect={() => action.onClick()}
                >
                  {action.icon}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </Card>
  );
}
