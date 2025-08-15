import { AlertCircle, Loader2 } from 'lucide-react';
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui';
import { useCurrentCap } from '@/shared/hooks';
import type { Cap } from '@/shared/types';
import { CapAvatar } from './cap-avatar';
import { CapStoreModal } from './cap-store-modal';
import { CapStoreModalProvider, useCapStoreModal } from './cap-store-modal-context';

const CapInfo = ({ cap }: { cap: Cap }) => (
  <>
    <CapAvatar
      capName={cap.metadata.displayName}
      capThumbnail={cap.metadata.thumbnail}
      size="sm"
    />
    <span className="text-sm font-normal">{cap.metadata.displayName}</span>
  </>
);

function CapSelectorButton() {
  const {
    currentCap,
    isCurrentCapMCPInitialized,
    isCurrentCapMCPError,
    errorMessage,
  } = useCurrentCap();
  const { openModal } = useCapStoreModal();
  return (
    <TooltipProvider>
      <Button
        variant="outline"
        size="sm"
        onClick={(event) => {
          event.preventDefault();
          openModal();
        }}
        className="rounded-lg"
        type="button"
      >
        <div className="flex items-center gap-2">
          <CapInfo cap={currentCap} />
          {!isCurrentCapMCPInitialized && (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          )}
        </div>
      </Button>
      {isCurrentCapMCPError && (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <AlertCircle className="w-3 h-3 text-destructive cursor-default" />
          </TooltipTrigger>
          <TooltipContent className="max-w-48 break-words">
            <p>
              {errorMessage ||
                'Cap Initialization Failed, Please Select Again or Check Network Connection'}
            </p>
          </TooltipContent>
        </Tooltip>
      )}
    </TooltipProvider>
  );
}

export function CapSelector() {
  return (
    <CapStoreModalProvider>
      <CapSelectorButton />
      <CapStoreModal />
    </CapStoreModalProvider>
  );
}
