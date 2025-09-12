import { ChevronDown, EditIcon, FilePlusIcon } from 'lucide-react';
import React, { useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  useSidebar,
} from '@/shared/components/ui';
import { useLanguage } from '@/shared/hooks/use-language';
import { cn } from '@/shared/utils';
import { useAppSidebar } from './app-sidebar';

export function SidebarNewButton() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { setOpenMobile } = useSidebar();
  const floatingContext = useAppSidebar();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useLocation().pathname;

  const handleNewChat = React.useCallback(() => {
    setOpenMobile(false);
    if (pathname.includes('artifacts')) {
      navigate('/artifacts');
    } else {
      navigate('/chat');
    }
  }, [navigate, setOpenMobile]);

  // Keyboard shortcut: Cmd/Ctrl + K
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'k' &&
        (event.metaKey || event.ctrlKey) &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNewChat]);

  const getShortcutDisplay = () => {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    return isMac ? '⌘K' : 'Ctrl+K';
  };

  // Keep dropdown the same width as the split button
  const splitRef = useRef<HTMLDivElement>(null);
  const [splitWidth, setSplitWidth] = useState<number>(0);
  useLayoutEffect(() => {
    const el = splitRef.current;
    if (!el) return;
    const update = () => setSplitWidth(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      ref={splitRef}
      className={cn(
        'my-2 inline-flex w-full h-10 items-stretch overflow-hidden',
        'rounded-md border border-theme-primary/20 bg-gradient-to-br from-theme-primary/80 via-theme-primary to-theme-primary/80 text-white',
        'shadow-lg shadow-theme-primary/25 hover:shadow-xl hover:shadow-theme-primary/30',
        'transition-transform duration-200 ease-out hover:scale-[1.02]',
        'divide-x divide-white/20',
      )}
    >
      {/* Main New Chat action (left segment) */}
      <button
        type="button"
        onClick={handleNewChat}
        className={cn(
          'inline-flex items-center flex-1 text-sm h-full',
          'bg-transparent shadow-none border-0 rounded-none',
          'pl-4 pr-2 justify-start relative font-medium gap-2',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/40 focus-visible:ring-offset-transparent',
        )}
      >
        <EditIcon size={16} className="shrink-0" />
        <span className="font-bold">{t('nav.sidebar.new')}</span>
        <kbd
          className={cn(
            'ml-auto text-xs font-mono px-1.5 py-0.5 rounded border',
            'text-white/90 bg-white/20 border-white/20 backdrop-blur-sm',
          )}
        >
          {getShortcutDisplay()}
        </kbd>
      </button>

      {/* Dropdown trigger (right segment) */}
      <DropdownMenu
        modal={true}
        open={menuOpen}
        onOpenChange={(open) => {
          setMenuOpen(open);
          floatingContext.stayHovering(open);
          if (!open) {
            floatingContext.closeSidebar();
            // Remove focus from the trigger button to eliminate the ring
            setTimeout(() => {
              (document.activeElement as HTMLElement)?.blur();
            }, 0);
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center h-full px-2',
              'bg-transparent shadow-none border-0 rounded-none',
              'transition-colors duration-200 ease-out',
            )}
            aria-label="Open new options"
          >
            <ChevronDown size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={4}
          style={{ width: splitWidth || undefined }}
        >
          <DropdownMenuItem
            className="hover:cursor-pointer"
            onClick={() => {
              setOpenMobile(false);
              navigate('/artifacts');
            }}
          >
            <FilePlusIcon className="h-4 w-4" />
            New Artifact
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
