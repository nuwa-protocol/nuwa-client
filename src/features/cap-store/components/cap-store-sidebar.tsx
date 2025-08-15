import {
  BookOpen,
  Bot,
  Code,
  Coins,
  Grid3X3,
  Heart,
  History,
  MoreHorizontal,
  Package,
  PenTool,
  Search,
  Wrench,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Input } from '@/shared/components/ui';
import { predefinedTags } from '@/shared/constants/cap';
import { useDebounceValue, useLanguage } from '@/shared/hooks';
import type { CapStoreSidebarSection } from '../types';

export interface CapStoreSidebarProps {
  activeSection: CapStoreSidebarSection;
  onSectionChange: (section: CapStoreSidebarSection) => void;
  onSearchChange: (query: string) => void;
}



export function CapStoreSidebar({
  activeSection,
  onSectionChange,
  onSearchChange,
}: CapStoreSidebarProps) {
  const { t } = useLanguage();
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearchValue, setDebouncedSearchValue] = useDebounceValue('', 500)


  const sidebarSections: CapStoreSidebarSection[] = [
    {
      id: 'favorites',
      label: t('capStore.sidebar.favorites') || 'Favorite Caps',
      type: 'section',
    },
    {
      id: 'recent',
      label: t('capStore.sidebar.recent') || 'Recent Caps',
      type: 'section',
    },
    { id: 'divider1', label: '', type: 'divider' },
    {
      id: 'all',
      label: t('capStore.sidebar.all') || 'All Caps',
      type: 'section',
    },
    ...predefinedTags.map((tag) => ({
      id: tag.toLowerCase().replace(/\s+/g, '-'),
      label: tag,
      type: 'tag' as const,
    })),
  ];

  const getSectionIcon = (sectionId: string, type: string) => {
    if (type === 'section') {
      switch (sectionId) {
        case 'favorites':
          return Heart;
        case 'recent':
          return History;
        case 'all':
          return Grid3X3;
        default:
          return Package;
      }
    }

    if (type === 'tag') {
      switch (sectionId) {
        case 'ai-model':
          return Bot;
        case 'coding':
          return Code;
        case 'content-writing':
          return PenTool;
        case 'research':
          return BookOpen;
        case 'crypto':
          return Coins;
        case 'tools':
          return Wrench;
        case 'others':
          return MoreHorizontal;
        default:
          return Package;
      }
    }

    return Package;
  };

  useEffect(() => {
    setSearchValue('');
  }, [activeSection]);

  useEffect(() => {
    onSearchChange(debouncedSearchValue);
  }, [debouncedSearchValue]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    setDebouncedSearchValue(value)
  };

  const handleClearSearch = () => {
    setSearchValue('');
    onSearchChange('');
    setDebouncedSearchValue('');
  };

  return (
    <div className="w-56 border-r bg-muted/30 overflow-y-auto shrink-0 flex flex-col">
      {/* Search Section */}
      <div className="p-4 border-b shrink-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Package className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Cap Store</span>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder={
                  t('capStore.searchPlaceholder') || 'Search caps...'
                }
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-3 space-y-1">
          {sidebarSections.map((section) => {
            if (section.type === 'divider') {
              return <hr key={section.id} className="my-2 border-border" />;
            }

            const IconComponent = getSectionIcon(section.id, section.type);

            const selected = activeSection.id === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onSectionChange(section)}
                className={`w-full text-left px-2.5 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2.5 ${selected
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-muted'
                  }`}
              >
                <IconComponent className="size-4 shrink-0" />
                <span className="truncate">{section.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
