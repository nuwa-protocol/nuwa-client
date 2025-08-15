import { ExternalLinkIcon, Globe } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/skeleton';
import type { UrlMetadata } from '../types';

interface SourceCardProps {
  source: {
    id?: string;
    title?: string;
    url?: string;
  };
  metadata: UrlMetadata | null;
  loading: boolean;
  index: number;
  onClick: () => void;
}

export const SourceCard = ({
  source,
  metadata,
  loading,
  index,
  onClick,
}: SourceCardProps) => {
  const url = source.url || '';
  const isExternalUrl = url.startsWith('http');

  // Extract best data from metadata
  const title =
    metadata?.['og:title'] ||
    metadata?.title ||
    source.title ||
    'Untitled Source';
  const description = metadata?.['og:description'] || metadata?.description;
  const image = metadata?.['og:image'] || metadata?.image;
  const siteName = metadata?.['og:site_name'];

  // Get best favicon - prefer higher resolution icons
  const getBestFavicon = () => {
    if (!metadata?.favicons || metadata.favicons.length === 0) return null;

    // Helper function to extract numeric size from sizes string
    const getMaxSize = (sizes?: string): number => {
      if (!sizes) return 0;
      const matches = sizes.match(/(\d+)/g);
      return matches ? Math.max(...matches.map(Number)) : 0;
    };

    // Priority order for favicon selection (prefer higher resolution)
    const priorityOrder = [
      // High resolution icons (192px, 180px, etc.)
      (f: any) => f.rel === 'icon' && getMaxSize(f.sizes) >= 180,
      (f: any) => f.rel === 'icon' && getMaxSize(f.sizes) >= 128,
      (f: any) => f.rel === 'icon' && getMaxSize(f.sizes) >= 64,
      
      // Apple touch icons (usually high quality)
      (f: any) => f.rel === 'apple-touch-icon' && getMaxSize(f.sizes) >= 152,
      
      // Standard sizes
      (f: any) => f.rel === 'icon' && f.sizes === '32x32',
      (f: any) => f.rel === 'icon' && f.sizes === '16x16',
      
      // Flexible size icons
      (f: any) => f.rel === 'icon' && f.sizes && f.sizes.includes('32'),
      (f: any) => f.rel === 'icon' && f.sizes && f.sizes.includes('16'),
      
      // Any icon with PNG type (usually higher quality than ICO)
      (f: any) => f.rel === 'icon' && f.type === 'image/png',
      
      // Any icon with SVG type (scalable)
      (f: any) => f.rel === 'icon' && f.type === 'image/svg+xml',
      
      // Any icon with specified type
      (f: any) => f.rel === 'icon' && f.type,
      
      // Any icon relation
      (f: any) => f.rel === 'icon',
      
      // Apple touch icon as fallback
      (f: any) => f.rel === 'apple-touch-icon',
      
      // Shortcut icon as fallback
      (f: any) => f.rel === 'shortcut icon',
      
      // Any favicon-like entry
      (f: any) => f.href && (f.href.includes('favicon') || f.href.includes('icon')),
      
      // Last resort - first entry
      () => true
    ];

    for (const priorityFn of priorityOrder) {
      const selected = metadata.favicons.find(priorityFn);
      if (selected) {
        // Handle relative URLs
        if (selected.href.startsWith('/') && url) {
          try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.host}${selected.href}`;
          } catch {
            return null;
          }
        }
        
        // Return absolute URLs as-is
        return selected.href || null;
      }
    }

    return null;
  };

  const faviconUrl = getBestFavicon();
  const hostname = url
    ? (() => {
      try {
        return new URL(url).hostname;
      } catch {
        return url;
      }
    })()
    : '';

  if (!isExternalUrl) {
    return (
      <div className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-muted-foreground/70 flex-shrink-0" />
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="w-6 h-4 text-xs text-muted-foreground/60 font-mono flex-shrink-0 flex items-center">
              {index + 1}
            </span>
            <span className="font-medium text-sm text-foreground/90">
              {title}
            </span>
            {url && (
              <span className="text-xs text-muted-foreground/60 truncate">
                • {url}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 hover:bg-accent transition-colors">
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left group"
      >
        <div className="space-y-2">
          {/* First row: index, favicon, site info, and external link icon */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-xs text-muted-foreground/60 font-mono flex-shrink-0">
                [{index + 1}]
              </span>

              {loading ? (
                <Skeleton className="w-4 h-4 rounded flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 flex-shrink-0 rounded overflow-hidden bg-muted/50">
                  {faviconUrl ? (
                    <img
                      src={faviconUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Globe className="w-3 h-3 text-muted-foreground/70 m-0.5" />
                  )}
                </div>
              )}

              {/* Site info on first row - prefer siteName, fallback to hostname */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {(siteName || hostname) && (
                  <span className="text-xs text-muted-foreground/60 truncate">
                    {siteName || hostname}
                  </span>
                )}
              </div>
            </div>
            <ExternalLinkIcon className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground/70 flex-shrink-0 transition-colors" />
          </div>

          {/* Second row: title */}
          <h3 className="font-medium text-sm text-foreground/90 group-hover:text-foreground transition-colors line-clamp-2">
            {loading ? <Skeleton className="h-4 w-full" /> : title}
          </h3>

          {/* Description */}
          {description && !loading && (
            <p className="text-sm text-muted-foreground/80 line-clamp-2">
              {description}
            </p>
          )}

          {/* Image */}
          {image && !loading && (
            <div>
              <img
                src={image}
                alt=""
                className="w-full max-w-xs h-24 object-cover rounded border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      </button>
    </div>
  );
};
