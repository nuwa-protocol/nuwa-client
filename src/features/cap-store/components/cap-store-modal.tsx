import * as Dialog from '@/shared/components/ui';
import { useLanguage } from '@/shared/hooks';
import type { Cap } from '@/shared/types/cap';
import { useCapStore } from '../hooks/use-cap-store';
import { useRemoteCap } from '../hooks/use-remote-cap';
import type { CapStoreSidebarSection, RemoteCap } from '../types';
import { CapStoreContent } from './cap-store-content';
import { useCapStoreModal } from './cap-store-modal-context';
import { CapStoreSidebar } from './cap-store-sidebar';



export function CapStoreModal() {
  const { t } = useLanguage();
  const { toggleModal, isOpen, activeSection, setActiveSection } = useCapStoreModal();

  const { remoteCaps, isLoading, error, fetchCaps, refetch } = useRemoteCap();
  const { getRecentCaps, getFavoriteCaps } = useCapStore();

  const handleSearchChange = (query: string) => {
    if (activeSection.type === 'tag') {
      fetchCaps({ searchQuery: query, tags: [activeSection.label] });
    } else if (activeSection.type === 'section') {
      fetchCaps({ searchQuery: query });
    }
  };

  const handleActiveSectionChange = (section: CapStoreSidebarSection) => {
    setActiveSection(section);
    if (section.type === 'tag') {
      fetchCaps({ tags: [section.label] });
    } else if (section.id === 'all') {
      fetchCaps({ searchQuery: '' });
    }
  };

  // Determine which caps to display based on active section
  const getDisplayCaps = (): (Cap | RemoteCap)[] => {
    if (activeSection.id === 'favorites') {
      return getFavoriteCaps();
    } else if (activeSection.id === 'recent') {
      return getRecentCaps();
    } else {
      return remoteCaps;
    }
  };

  const displayCaps: (Cap | RemoteCap)[] = getDisplayCaps();

  return (
    <Dialog.Dialog open={isOpen} onOpenChange={toggleModal}>
      <Dialog.DialogContent
        className="fixed left-1/2 top-1/2 z-50 flex flex-col -translate-x-1/2 -translate-y-1/2 gap-0 border bg-background p-0 shadow-lg sm:rounded-lg overflow-hidden [&>button:last-child]:hidden"
        style={{
          width: '90vw',
          maxWidth: 1200,
          height: '85vh',
          maxHeight: 800,
          minHeight: 0,
        }}
        aria-describedby={undefined}
      >
        <Dialog.DialogTitle className="sr-only">
          {t('capStore.title')}
        </Dialog.DialogTitle>

        {/* Main Content with Sidebar */}
        <div className="flex-1 min-h-0 flex">
          <CapStoreSidebar
            activeSection={activeSection}
            onSectionChange={handleActiveSectionChange}
            onSearchChange={handleSearchChange}
          />

          {/* Content Area */}
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="p-6">
              <CapStoreContent
                caps={displayCaps}
                activeSection={activeSection}
                isLoading={isLoading}
                error={error}
                onRefresh={() => refetch()}
              />
            </div>
          </div>
        </div>
      </Dialog.DialogContent>
    </Dialog.Dialog>
  );
}
