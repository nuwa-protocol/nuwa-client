import { LinkIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet';
import { useUrlMetadata } from '../hooks/use-url-metadata';
import type { UrlMetadata } from '../types';
import { SourceCard } from './source-card';

interface MessageSourceSidebarProps {
  sources: Array<{
    id?: string;
    title?: string;
    url?: string;
  }>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MessageSourceSidebar = ({
  sources,
  isOpen,
  onOpenChange,
}: MessageSourceSidebarProps) => {
  const [metadataMap, setMetadataMap] = useState<Record<string, UrlMetadata>>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const { getUrlMetadata } = useUrlMetadata();

  useEffect(() => {
    if (!isOpen || sources.length === 0) return;

    const fetchMetadata = async () => {
      setLoading(true);
      try {
        const urls = sources
          .map((source) => source.url)
          .filter((url): url is string =>
            Boolean(url && url.startsWith('http')),
          );

        if (urls.length === 0) {
          setLoading(false);
          return;
        }

        const metadata = await getUrlMetadata(urls);

        // Map the metadata to URLs
        const metadataByUrl: Record<string, UrlMetadata> = {};
        if (Array.isArray(metadata)) {
          metadata.forEach((meta, index) => {
            if (urls[index]) {
              metadataByUrl[urls[index]] = meta;
            }
          });
        } else if (metadata && typeof metadata === 'object') {
          // Handle case where metadata is returned as an object with URL keys
          Object.entries(metadata).forEach(([url, meta]) => {
            metadataByUrl[url] = meta as UrlMetadata;
          });
        }

        setMetadataMap(metadataByUrl);
      } catch (error) {
        console.error('Error fetching URL metadata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [isOpen, sources]);

  const handleSourceClick = (url: string) => {
    if (url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange} modal={false}>
      <SheetContent side="right" className="w-[400px] sm:w-[500px]">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-muted-foreground" />
              <SheetTitle className="text-base">
                Sources ({sources.length})
              </SheetTitle>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {sources.map((source, index) => {
            const url = source.url || '';
            const metadata = url ? metadataMap[url] : null;

            return (
              <SourceCard
                key={`source-${index}-${source.id || 'unknown'}`}
                source={source}
                metadata={metadata}
                loading={loading}
                index={index}
                onClick={() => handleSourceClick(url)}
              />
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};
