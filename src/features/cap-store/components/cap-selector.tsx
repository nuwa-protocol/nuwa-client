import { AlertCircle, Download, Eye, Loader2, Package, Sparkles, Star } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCapStore } from '@/features/cap-store/stores';
import type { RemoteCap } from '@/features/cap-store/types';
import { CapStudioStore } from '@/features/cap-studio/stores/cap-studio-stores';
import type { LocalCap } from '@/features/cap-studio/types';
import { CapAvatar } from '@/shared/components/cap-avatar';
import {
  Badge,
  Button,
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui';
import { useDebounceValue } from '@/shared/hooks/use-debounce-value';
import useDevMode from '@/shared/hooks/use-dev-mode';
import { capKitService } from '@/shared/services/capkit-service';
import { CurrentCapStore } from '@/shared/stores/current-cap-store';
import { InstalledCapsStore } from '@/shared/stores/installed-caps-store';
import type { Cap } from '@/shared/types';
import { cn } from '@/shared/utils/cn';

const LIVE_DEV_BADGE_CLASSES =
  'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-400/20 dark:text-amber-100 dark:border-amber-300';

export function CapSelector() {
  const { currentCap, setCurrentCap, isInitialized, isError, errorMessage, retryCurrentCapInit } =
    CurrentCapStore();
  const { installedCaps } = InstalledCapsStore();
  const { localCaps } = CapStudioStore();
  const { remoteCaps, isFetching, fetchCaps } = useCapStore();
  const isDevMode = useDevMode();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearchValue, setDebouncedSearchValue] = useDebounceValue(
    '',
    400,
  );
  // Input ref to force focus so typing always goes into the search box
  // TS: initialize with null; we narrow before use
  const inputRef = useRef<HTMLInputElement>(null as any);
  const [activeTab, setActiveTab] = useState<'my-caps' | 'cap-studio' | 'store'>('my-caps');

  // Global shortcut: Cmd/Ctrl + K to open the search dialog
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.shiftKey &&
        !event.altKey &&
        event.key.toLowerCase() === 'k'
      ) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Debounced remote search when dialog is open (also fetch on empty query)
  useEffect(() => {
    const q = debouncedSearchValue.trim();
    if (!open) return;
    fetchCaps({ searchQuery: q, page: 0, size: 20 }).catch(() => {
      /* handled by store */
    });
  }, [debouncedSearchValue, open]);

  // Pick a sensible default cap when none is selected yet.
  // Prefer first installed cap; if none, fall back to first local cap (dev mode only).
  useEffect(() => {
    if (!currentCap) {
      const firstInstalled = installedCaps[0];
      // Only consider local caps when dev mode is enabled (they are visible in the menu then)
      const firstLocal = isDevMode ? localCaps[0] : undefined;
      if (firstInstalled) setCurrentCap(firstInstalled);
      else if (firstLocal) setCurrentCap(firstLocal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCap, installedCaps, isDevMode, localCaps]);

  // Directly switch to a local cap (no download)
  const handleLocalCapSelect = (cap: LocalCap) => {
    try {
      setCurrentCap(cap);
    } catch (error) {
      console.error('Failed to select local cap:', error);
      toast.error('Failed to load local cap');
    }
  };

  // Directly switch to an installed cap (no download)
  const handleInstalledCapSelect = (cap: Cap) => {
    try {
      setCurrentCap(cap);
    } catch (error) {
      console.error('Failed to select installed cap:', error);
      toast.error('Failed to load cap');
    }
  };

  // Install remotely and switch to it
  const handleRemoteCapSelect = async (cap: RemoteCap) => {
    try {
      // If already installed, just switch
      const alreadyInstalled = installedCaps.some((c) => c.id === cap.id);
      if (alreadyInstalled) {
        const installed = installedCaps.find((c) => c.id === cap.id)!;
        handleInstalledCapSelect(installed);
        setOpen(false);
        return;
      }

      // Download and favorite (install), then set current
      await toast.promise(
        (async () => {
          // Download cap binary/details
          const downloaded = await useCapStore
            .getState()
            .downloadCapByIDWithCache(cap.id);

          // Mark as favorite so it shows in Installed
          const capKit = await capKitService.getCapKit();
          await capKit.install(cap.id, 'add');

          setCurrentCap(downloaded);
        })(),
        {
          loading: 'Installing cap…',
          success: 'Cap installed and ready!',
          error: 'Failed to install cap',
        },
      );
      setOpen(false);
    } catch (error) {
      console.error('Failed to install cap:', error);
    }
  };

  // Only show local caps in the selector when dev mode is enabled
  const localCapsToShow = isDevMode ? localCaps : [];

  const capName =
    currentCap &&
    ('capData' in currentCap
      ? currentCap.capData.metadata.displayName
      : currentCap.metadata.displayName);

  // OS-aware shortcut text for the command palette
  // Using a simple client-side check; falls back to Ctrl on non-Mac platforms
  const shortcutText = (() => {
    try {
      const isMac =
        typeof navigator !== 'undefined' &&
        /Mac|iPhone|iPod|iPad/i.test(navigator.platform || '');
      return isMac ? '⌘ K' : 'Ctrl K';
    } catch {
      return 'Ctrl K';
    }
  })();

  if (!currentCap) {
    return null;
  }

  const currentLocalCap =
    'capData' in currentCap ? (currentCap as LocalCap) : undefined;
  const isCurrentLiveDev = Boolean(currentLocalCap?.liveSource?.url);

  // Precompute filtered lists (Command's own filtering is disabled)
  const q = searchValue.trim().toLowerCase();
  const filteredLocalCaps = isDevMode
    ? q
      ? localCapsToShow.filter((cap) => matchesCap(cap, q))
      : localCapsToShow
    : [];
  const filteredInstalledCaps = q
    ? installedCaps.filter((cap) => matchesCap(cap, q))
    : installedCaps;

  return (
    <TooltipProvider>
      {/* Trigger button opens the search dialog */}
      <Button
        variant="ghost"
        className="group rounded-lg justify-center items-center hover:bg-transparent w-fit min-w-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open cap search"
      >
        <div className="flex items-center justify-start gap-2 w-full min-w-0 flex-1">
          <CapAvatar cap={currentCap} size="lg" className="rounded-md" />
          <span className="text-sm font-medium truncate text-left min-w-0">
            {capName || 'Install a cap to start'}
          </span>
          {/* Local Cap badge */}
          {currentLocalCap && (
            <Badge
              variant="secondary"
              className={cn(
                'ml-1 text-xs',
                isCurrentLiveDev && LIVE_DEV_BADGE_CLASSES,
              )}
            >
              {isCurrentLiveDev ? 'Live Dev' : 'Dev'}
            </Badge>
          )}
          {/* Cap loading indicator */}
          {!isInitialized && (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground flex-shrink-0" />
          )}
          {/* Cap error indicator */}
          {isError && (
            <Tooltip>
              {/* Wrap the icon so it can receive pointer events inside Button
                  (Button sets [&_svg]:pointer-events-none by default). */}
              <TooltipTrigger asChild>
                <span className="inline-flex pointer-events-auto">
                  <AlertCircle className="w-3 h-3 text-destructive" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="z-[1000] max-w-sm break-words space-y-2 py-2 px-3 leading-3">
                <p className="text-sm leading-3 text-destructive">
                  {'Cap Errors, some Cap functions might not work.'}
                </p>
                {errorMessage && (
                  <p className="text-xs text-muted-foreground">
                    {errorMessage}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-auto w-full px-2 py-1 text-sm text-theme-500"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    retryCurrentCapInit();
                  }}
                >
                  Retry
                </Button>
              </TooltipContent>
            </Tooltip>
          )}
          {/* Small subtle shortcut badge next to cap name */}
          <span
            className="ml-1 inline-flex items-center rounded-md border border-border bg-muted/50 px-1.5 py-[1px] text-[10px] leading-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            aria-hidden
          >
            {shortcutText}
          </span>
        </div>
      </Button>
      {/* Command palette dialog for searching caps */}
      <DialogLikeCommand
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
        }}
        inputRef={inputRef}
        searchValue={searchValue}
        setSearchValue={(v) => {
          setSearchValue(v);
          setDebouncedSearchValue(v);
        }}
      >
        {/* We disable built-in filtering so remote/store results are not filtered by cmdk.
            Local/Installed groups are filtered manually below. */}
        <Command
          shouldFilter={false}
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
        >
          <CommandInput
            ref={inputRef}
            autoFocus
            placeholder="Search AI Capabilities..."
            value={searchValue}
            onValueChange={(v) => {
              setSearchValue(v);
              setDebouncedSearchValue(v);
            }}
          />
          <div className="px-2 py-2 flex min-h-0 flex-1 flex-col">
            <Tabs
              className="flex min-h-0 flex-1 flex-col"
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'my-caps' | 'cap-studio' | 'store')}
            >
              <TabsList className={cn("w-full h-auto rounded-none border-b bg-transparent p-0 grid", isDevMode ? "grid-cols-3" : "grid-cols-2")}>
                <TabsTrigger
                  value="my-caps"
                  className="data-[state=active]:after:bg-primary relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  My Caps
                </TabsTrigger>
                {isDevMode && (
                  <TabsTrigger
                    value="cap-studio"
                    className="data-[state=active]:after:bg-primary relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    Cap Studio
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="store"
                  className="data-[state=active]:after:bg-primary relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  Store
                </TabsTrigger>
              </TabsList>
              <CommandList className="max-h-none min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                {/* My Caps Tab: Cap Studio + Installed */}
                <TabsContent value="my-caps">
                  <CommandGroup>
                    {installedCaps.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 w-full py-3 px-2 text-center">
                        <Package className="w-6 h-6 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          No Installed Caps
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Browse the store and install a cap to get started.
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mt-1"
                          onClick={() => {
                            setOpen(false);
                            navigate('/explore');
                          }}
                        >
                          <Sparkles className="w-4 h-4 mr-2" /> Explore More
                        </Button>
                      </div>
                    ) : filteredInstalledCaps.length > 0 ? (
                      filteredInstalledCaps.map((cap) => (
                        <CommandItem
                          key={`installed-${cap.id}`}
                          className="group"
                          onSelect={() => {
                            handleInstalledCapSelect(cap);
                            setOpen(false);
                          }}
                        >
                          <CapItem cap={cap} />
                        </CommandItem>
                      ))
                    ) : (
                      <div className="px-2 py-2 text-sm text-muted-foreground">
                        No installed caps match your search.
                      </div>
                    )}
                  </CommandGroup>
                </TabsContent>

                <TabsContent value="cap-studio">
                  <CommandGroup>
                    {localCapsToShow.length === 0 ? (
                      <div className="px-2 py-2 text-sm text-muted-foreground">
                        No Caps in the Cap Studio yet.
                      </div>
                    ) : filteredLocalCaps.length > 0 ? (
                      filteredLocalCaps.map((cap) => (
                        <CommandItem
                          key={`local-${cap.id}`}
                          className="group"
                          onSelect={() => {
                            handleLocalCapSelect(cap);
                            setOpen(false);
                          }}
                        >
                          <CapItem cap={cap} />
                        </CommandItem>
                      ))
                    ) : (
                      <div className="px-2 py-2 text-sm text-muted-foreground">
                        No Cap Studio caps match your search.
                      </div>
                    )}
                  </CommandGroup>
                </TabsContent>

                {/* Store Tab: not filtered by Command; uses backend search */}
                <TabsContent value="store">
                  <CommandGroup>
                    {isFetching && (
                      <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" /> Searching…
                      </div>
                    )}
                    {!isFetching && (() => {
                      const visible = remoteCaps.filter((rc) =>
                        installedCaps.every((c) => c.id !== rc.id),
                      );
                      if (visible.length > 0) {
                        return visible.slice(0, 20).map((cap) => (
                          <CommandItem
                            key={`remote-${cap.id}`}
                            className="group"
                            onSelect={() => handleRemoteCapSelect(cap)}
                          >
                            <RemoteStoreItem cap={cap} />
                            {/* Hover-only details button that opens the store details page */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOpen(false);
                                navigate(`/explore/caps/${cap.id}`);
                              }}
                            >
                              Details
                            </Button>
                          </CommandItem>
                        ));
                      }
                      // Show different empty text depending on whether this was a search
                      const hasQuery = searchValue.trim().length > 0;
                      return (
                        <div className="px-2 py-2 text-sm text-muted-foreground">
                          {hasQuery
                            ? 'No store caps match your search.'
                            : remoteCaps.length === 0
                              ? 'No caps found in store.'
                              : 'All matching caps are already installed.'}
                        </div>
                      );
                    })()}
                  </CommandGroup>
                </TabsContent>
              </CommandList>
            </Tabs>
          </div>
        </Command>
      </DialogLikeCommand>
    </TooltipProvider>
  );
}

const CapItem = ({
  cap,
  isInstalled,
}: {
  cap: Cap | LocalCap | RemoteCap;
  isInstalled?: boolean;
}) => {
  const isLocal = 'capData' in cap;
  const capData = isLocal ? cap.capData : cap;
  const isLiveDebugging = isLocal ? Boolean(cap.liveSource?.url) : false;
  return (
    <>
      <CapAvatar cap={cap} size="md" className="rounded-md" />
      <span className="font-medium">{capData.metadata.displayName}</span>
      {isLocal && (
        <Badge
          variant="secondary"
          className={cn('ml-auto', isLiveDebugging && LIVE_DEV_BADGE_CLASSES)}
        >
          {isLiveDebugging ? 'Live Dev' : 'Dev'}
        </Badge>
      )}
      {isInstalled && (
        <Badge variant="secondary" className="ml-auto">
          Installed
        </Badge>
      )}
    </>
  );
};

// Return whether a cap's name/tags match a query
function matchesCap(cap: Cap | LocalCap | RemoteCap, q: string): boolean {
  const isLocal = (cap as any).capData !== undefined;
  const meta = isLocal
    ? (cap as LocalCap).capData.metadata
    : (cap as Cap).metadata;
  const name = (meta.displayName || '').toLowerCase();
  const tags = (meta.tags || []).join(' ').toLowerCase();
  return name.includes(q) || tags.includes(q);
}

// Store item layout with description and stats
function RemoteStoreItem({ cap }: { cap: RemoteCap }) {
  const meta = cap.metadata;
  const stats = cap.stats;
  return (
    <div className="flex items-start gap-3 w-full">
      <CapAvatar cap={cap} size="md" className="rounded-md" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium leading-5 line-clamp-1">
          {meta.displayName}
        </div>
        <div className="text-xs text-muted-foreground line-clamp-1">
          {meta.description}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {/* Force smaller icon size; override parent cmdk item svg sizing */}
            <Star className="!w-3 !h-3 shrink-0" />
            {Number.isFinite(stats.averageRating)
              ? stats.averageRating.toFixed(1)
              : '0.0'}
            <span className="opacity-70">({stats.ratingCount})</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="!w-3 !h-3 shrink-0" />
            {stats.downloads}
          </span>
          <span className="inline-flex items-center gap-1">
            <Download className="!w-3 !h-3 shrink-0" />
            {stats.favorites}
          </span>
        </div>
      </div>
    </div>
  );
}

// Small wrapper that renders a Dialog with keyboard routing to the Command input
function DialogLikeCommand({
  open,
  onOpenChange,
  children,
  inputRef,
  searchValue,
  setSearchValue,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  inputRef: React.RefObject<HTMLInputElement>;
  searchValue: string;
  setSearchValue: (v: string) => void;
}) {
  // Reset search when the dialog is closed
  useEffect(() => {
    if (!open) {
      setSearchValue('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Route typing to the search input when focus leaves it, except arrows/enter
  const onKeyDownCapture = (e: React.KeyboardEvent) => {
    if (!open) return;
    const key = e.key;
    const isNav = key === 'Enter' || key.startsWith('Arrow');
    const hasMod = e.metaKey || e.ctrlKey || e.altKey;
    if (hasMod || isNav) return; // let Command handle navigation/shortcuts
    const target = e.target as HTMLElement;
    const isInsideInput = target?.closest('[cmdk-input-wrapper]');
    if (!isInsideInput) {
      // Focus input and update value for character/backspace keys
      inputRef.current?.focus();
      if (key === 'Backspace') {
        e.preventDefault();
        setSearchValue(searchValue.slice(0, -1));
      } else if (key.length === 1 && !e.repeat) {
        e.preventDefault();
        setSearchValue(searchValue + key);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className='sr-only'>Cap Selector</DialogTitle>
      <DialogDescription className='sr-only'>Select a cap to start</DialogDescription>
      <DialogContent
        onKeyDownCapture={onKeyDownCapture}
        className="overflow-hidden p-0 shadow-lg max-w-md h-[560px] max-h-[80vh]"
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
