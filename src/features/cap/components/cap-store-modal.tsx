import { Loader2, Package, Search } from 'lucide-react';
import { useState } from 'react';
import * as Dialog from '@/shared/components/ui';
import {
  Button,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui';
import { useLanguage } from '@/shared/hooks/use-language';
import { useCapRemote } from '../hooks/use-cap-remote';
import { useInstalledCaps } from '../hooks/use-caps-installed';
import type { CapDisplayData, RemoteCap } from '../types';
import { CapCard } from './cap-card';

interface CapStoreModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function CapStoreModal({
  open,
  onOpenChange,
  children,
}: CapStoreModalProps) {
  const { t } = useLanguage();
  const {
    installCap,
    uninstallCap,
    isCapInstalled,
    getInstalledCap,
    isCapEnabled,
    enableCap,
    disableCap,
  } = useInstalledCaps();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const { remoteCaps, isLoading, error, refetch } = useCapRemote({
    searchQuery,
    category: activeTab,
  });

  const tabs = [
    { id: 'all', label: t('capStore.tabs.all') },
    { id: 'development', label: t('capStore.tabs.development') },
    { id: 'design', label: t('capStore.tabs.design') },
    { id: 'analytics', label: t('capStore.tabs.analytics') },
    { id: 'productivity', label: t('capStore.tabs.productivity') },
    { id: 'security', label: t('capStore.tabs.security') },
  ];

  // Combine remote caps with local state
  const capDisplayData: CapDisplayData[] = remoteCaps.map((remoteCap) => {
    const isInstalled = isCapInstalled(remoteCap.id);
    const localCap = getInstalledCap(remoteCap.id);
    const isEnabled = isCapEnabled(remoteCap.id);
    const hasUpdate =
      isInstalled && localCap ? localCap.version !== remoteCap.version : false;

    return {
      remote: remoteCap,
      local: localCap || undefined,
      isInstalled,
      isEnabled,
      hasUpdate,
      installedVersion: localCap?.version,
    };
  });

  const handleInstallCap = (remoteCap: RemoteCap) => {
    // Convert RemoteCap to the format needed for installation
    installCap({
      id: remoteCap.id,
      name: remoteCap.name,
      tag: remoteCap.tag,
      description: remoteCap.description,
      version: remoteCap.version,
      cap: remoteCap.cap, // Include the full cap object
    });
  };

  const handleUninstallCap = (capId: string) => {
    uninstallCap(capId);
  };

  const handleToggleEnable = (capId: string, currentlyEnabled: boolean) => {
    if (currentlyEnabled) {
      disableCap(capId);
    } else {
      enableCap(capId);
    }
  };

  return (
    <Dialog.Dialog
      {...(open !== undefined && onOpenChange ? { open, onOpenChange } : {})}
    >
      {children && (
        <Dialog.DialogTrigger asChild>{children}</Dialog.DialogTrigger>
      )}
      <Dialog.DialogContent
        className="fixed left-1/2 top-1/2 z-50 flex flex-col -translate-x-1/2 -translate-y-1/2 gap-0 border bg-background p-0 shadow-lg sm:rounded-lg overflow-hidden"
        style={{
          width: '90vw',
          maxWidth: 1000,
          height: '85vh',
          maxHeight: 800,
          minHeight: 0,
        }}
        aria-describedby={undefined}
      >
        <Dialog.DialogTitle className="sr-only">
          {t('capStore.title')}
        </Dialog.DialogTitle>
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="border-b px-6 py-4 shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <Package className="size-6" />
              <div>
                <h2 className="text-lg font-semibold">{t('capStore.title')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('capStore.description')}
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t('capStore.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 flex flex-col">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Tab List - Sticky */}
              <div className="shrink-0 border-b px-6 py-3 bg-background">
                <TabsList className="grid w-full grid-cols-6">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="text-xs"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Tab Content - Scrollable */}
              <div className="flex-1 min-h-0 overflow-auto">
                {tabs.map((tab) => (
                  <TabsContent
                    key={tab.id}
                    value={tab.id}
                    className="data-[state=active]:block data-[state=inactive]:hidden m-0"
                  >
                    <div className="p-6">
                      {error ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                          <Package className="size-12 text-red-500 mb-4" />
                          <h3 className="text-lg font-medium mb-2 text-red-600">
                            {t('capStore.status.error')}
                          </h3>
                          <p className="text-muted-foreground max-w-md mb-4">
                            {t('capStore.status.errorDesc')}
                          </p>
                          <Button variant="outline" onClick={refetch}>
                            {t('capStore.status.tryAgain')}
                          </Button>
                        </div>
                      ) : isLoading ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                          <Loader2 className="size-12 text-muted-foreground mb-4 animate-spin" />
                          <h3 className="text-lg font-medium mb-2">
                            {t('capStore.status.loading')}
                          </h3>
                          <p className="text-muted-foreground max-w-md">
                            {t('capStore.status.fetching')}
                          </p>
                        </div>
                      ) : capDisplayData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                          <Package className="size-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium mb-2">
                            {t('capStore.status.noCaps')}
                          </h3>
                          <p className="text-muted-foreground max-w-md">
                            {searchQuery.trim()
                              ? t('capStore.status.noCapsDesc.search')
                              : t('capStore.status.noCapsDesc.category')}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6 min-h-0">
                          {capDisplayData.map((capData) => (
                            <CapCard
                              key={capData.remote.id}
                              capData={capData}
                              onInstall={() => handleInstallCap(capData.remote)}
                              onUninstall={() =>
                                handleUninstallCap(capData.remote.id)
                              }
                              onToggleEnable={() =>
                                handleToggleEnable(
                                  capData.remote.id,
                                  capData.isEnabled,
                                )
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </div>
        </div>
      </Dialog.DialogContent>
    </Dialog.Dialog>
  );
}
