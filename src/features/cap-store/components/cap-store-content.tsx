import { Clock, Loader2, Package, Star } from 'lucide-react';
import { Button } from '@/shared/components/ui';
import { useLanguage } from '@/shared/hooks';
import type { Cap } from '@/shared/types/cap';
import { useCapStore } from '../hooks/use-cap-store';
import type { CapStoreSidebarSection, RemoteCap } from '../types';
import { sortCapsByMetadata } from '../utils';
import { CapCard } from './cap-card';

export interface CapStoreContentProps {
  caps: (Cap | RemoteCap)[];
  activeSection: CapStoreSidebarSection;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export function CapStoreContent({
  caps,
  activeSection,
  isLoading = false,
  error = null,
  onRefresh,
}: CapStoreContentProps) {
  const { t } = useLanguage();
  const {
    addCapToFavorite,
    removeCapFromFavorite,
    removeCapFromRecents,
    isCapFavorite,
  } = useCapStore();

  const isShowingInstalled = ['favorites', 'recent'].includes(activeSection.id);

  // sort the caps by metadata
  const sortedCaps = sortCapsByMetadata(caps);

  // Function to get actions based on cap type and active section
  const getCapActions = (cap: Cap | RemoteCap) => {
    const actions = [];

    const isRemoteCap = 'cid' in cap;

    if (isCapFavorite(cap.id)) {
      actions.push({
        icon: <Star className="size-4" />,
        label: 'Remove from Favorites',
        onClick: () => removeCapFromFavorite(cap.id),
      });
    } else {
      actions.push({
        icon: <Star className="size-4" />,
        label: 'Add to Favorites',
        onClick: () =>
          addCapToFavorite(cap.id, isRemoteCap ? cap.cid : undefined),
      });
    }

    if (activeSection.id === 'recent') {
      actions.push({
        icon: <Clock className="size-4" />,
        label: 'Remove from Recents',
        onClick: () => removeCapFromRecents(cap.id),
      });
    }

    return actions;
  };

  if (error && !isShowingInstalled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[700px] text-center">
        <Package className="size-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium mb-2 text-red-600">
          {t('capStore.status.error')}
        </h3>
        <p className="text-muted-foreground max-w-md mb-4">
          {t('capStore.status.errorDesc')}
        </p>
        <Button variant="outline" onClick={onRefresh}>
          {t('capStore.status.tryAgain')}
        </Button>
      </div>
    );
  }

  if (isLoading && !isShowingInstalled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[700px] text-center">
        <Loader2 className="size-12 text-muted-foreground mb-4 animate-spin" />
        <h3 className="text-lg font-medium mb-2">
          {t('capStore.status.loading')}
        </h3>
      </div>
    );
  }

  if (sortedCaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[700px] text-center">
        <Package className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">
          {getEmptyStateTitle(activeSection.id, t)}
        </h3>
        <p className="text-muted-foreground max-w-md">
          {getEmptyStateDescription(activeSection.id, t)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Title with Count */}
      <div className="flex items-center justify-between border-b border-muted-foreground/20 pb-2">
        <h2 className="text-lg font-medium">
          {activeSection.label} ({sortedCaps.length})
        </h2>
      </div>

      {/* Caps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6 min-h-0">
        {sortedCaps.length > 0 &&
          sortedCaps.map((cap) => {
            // Type guard to check if cap is RemoteCap (has cid property)
            const isRemoteCap = 'cid' in cap;

            if (isRemoteCap) {
              // RemoteCap type - use cid as unique key
              return (
                <CapCard key={cap.id} cap={cap} actions={getCapActions(cap)} />
              );
            } else {
              // Cap type - use id as unique key
              return (
                <CapCard key={cap.id} cap={cap} actions={getCapActions(cap)} />
              );
            }
          })}
      </div>
    </div>
  );
}

function getEmptyStateTitle(activeSection: string, t: any): string {
  switch (activeSection) {
    case 'favorites':
      return t('capStore.status.noFavoriteCaps') || 'No Favorite Caps';
    case 'recent':
      return t('capStore.status.noRecentCaps') || 'No Recent Caps';
    default:
      return t('capStore.status.noCaps') || 'No Caps Found';
  }
}

function getEmptyStateDescription(activeSection: string, t: any): string {
  switch (activeSection) {
    case 'favorites':
      return (
        t('capStore.status.noFavoriteCapsDesc') ||
        "You haven't marked any caps as favorites yet. Browse the store and favorite caps you like."
      );
    case 'recent':
      return (
        t('capStore.status.noRecentCapsDesc') ||
        "You haven't used any caps recently. Try running a cap to see it here."
      );
    default:
      return (
        t('capStore.status.noCapsDesc.category') ||
        'No caps found in this category. Try searching or browse other categories.'
      );
  }
}
