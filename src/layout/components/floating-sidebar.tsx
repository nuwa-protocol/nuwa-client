'use client';

import {
  createContext,
  memo,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useSidebarSettings } from '@/features/settings/hooks/use-settings-sidebar';
import { SidebarInset, SidebarProvider } from '@/shared/components/ui';
import { cn } from '@/shared/utils';
import { AppSidebar } from './app-sidebar';

// Context for managing floating sidebar hover state
const FloatingSidebarContext = createContext<{
  isHovering: boolean;
  setIsHovering: (hovering: boolean) => void;
  stayHovering: (stay: boolean) => void;
} | null>(null);

export const useFloatingSidebar = () => {
  const context = useContext(FloatingSidebarContext);

  if (!context) {
    throw new Error(
      'useFloatingSidebar must be used within FloatingSidebarProvider',
    );
  }
  return context;
};

interface FloatingSidebarLayoutProps {
  children: ReactNode;
}

// Memoize the content wrapper to prevent unnecessary re-renders
const ContentWrapper = memo(
  ({ children, isFloating }: { children: ReactNode; isFloating: boolean }) => {
    return (
      <SidebarInset
        className={cn(
          'flex-1 transition-all duration-300 ease-in-out', // Add smooth transition
          // Enhanced animation for content positioning
          isFloating
            ? 'w-full ml-0'
            : // Full width in floating mode
              '', // Normal layout in pinned mode
        )}
      >
        <div className={'h-full transition-all duration-300 ease-in-out'}>
          {children}
        </div>
      </SidebarInset>
    );
  },
);
ContentWrapper.displayName = 'ContentWrapper';

function SidebarLayoutContent({ children }: FloatingSidebarLayoutProps) {
  const { collapsed: sidebarCollapsed, mode: sidebarMode } =
    useSidebarSettings();

  // Get hover state from context (handle null gracefully)
  const floatingContext = useContext(FloatingSidebarContext);
  const isHovering = floatingContext?.isHovering ?? false;

  // Calculate if sidebar should be open
  const shouldBeOpen =
    sidebarMode === 'floating' ? isHovering : !sidebarCollapsed;
  const isFloating = sidebarMode === 'floating';

  // Memoize the content wrapper to prevent re-renders when only positioning changes
  const contentElement = useMemo(() => {
    return <ContentWrapper isFloating={isFloating}>{children}</ContentWrapper>;
  }, [children, isFloating]);

  return (
    <SidebarProvider defaultOpen={shouldBeOpen} open={shouldBeOpen}>
      {/* Always use the same DOM structure, but with different positioning */}
      <div className="relative flex w-full min-h-screen">
        {/* Sidebar container with smooth transition animation */}
        <div
          className={cn(
            'transition-all duration-300 ease-in-out', // Smooth transition for position changes
            isFloating
              ? 'fixed inset-y-0 left-0 z-50 w-0' // No width, positioned absolutely
              : 'relative w-64', // Normal layout flow
          )}
        >
          <AppSidebar />
        </div>

        {/* Main content area - memoized to prevent re-renders */}
        {contentElement}
      </div>
    </SidebarProvider>
  );
}

export function FloatingSidebarLayout({
  children,
}: FloatingSidebarLayoutProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isStaying, setIsStaying] = useState(false);
  const { mode: sidebarMode } = useSidebarSettings();

  // stayHovering: lock or unlock the hover state
  const stayHovering = useCallback((stay: boolean) => {
    setIsStaying(stay);
    if (stay) setIsHovering(true);
  }, []);

  // Only allow setIsHovering if not locked
  const stableSetIsHovering = useCallback(
    (hovering: boolean) => {
      if (!isStaying) setIsHovering(hovering);
    },
    [isStaying],
  );

  const contextValue = useMemo(
    () => ({
      isHovering,
      setIsHovering: stableSetIsHovering,
      stayHovering,
    }),
    [isHovering, stableSetIsHovering, stayHovering],
  );

  return (
    <FloatingSidebarContext.Provider value={contextValue}>
      <div className="relative size-full">
        <SidebarLayoutContent>{children}</SidebarLayoutContent>

        {/* Hover trigger area for floating mode */}
        {sidebarMode === 'floating' && (
          <div
            aria-hidden="true"
            className="fixed left-0 top-0 w-20 h-full z-40 bg-transparent pointer-events-auto"
            onMouseEnter={() => stableSetIsHovering(true)}
            onMouseLeave={() => stableSetIsHovering(false)}
          />
        )}
      </div>
    </FloatingSidebarContext.Provider>
  );
}

// Hook to get the computed open state based on mode (for external use)
export const useSidebarOpenState = () => {
  const { collapsed: sidebarCollapsed, mode: sidebarMode } =
    useSidebarSettings();

  // Get hover state from context (handle null gracefully)
  const floatingContext = useContext(FloatingSidebarContext);
  const isHovering = floatingContext?.isHovering ?? false;

  // In floating mode, use hover state; in pinned mode, respect the collapsed state
  return sidebarMode === 'floating' ? isHovering : !sidebarCollapsed;
};
