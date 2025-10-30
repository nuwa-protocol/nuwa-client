import type { Cap } from '@nuwa-ai/cap-kit';
import {
  Download,
  Eye,
  Fingerprint,
  GitBranch,
  Share2,
  ShieldCheck,
  Tag,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { CapAvatar } from '@/shared/components/cap-avatar';
import {
  Badge,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui';
import { ShareDialog } from '@/shared/components/ui/shadcn-io/share-dialog';
import type { RemoteCap } from '../../types';
import { CapActionButton } from '../cap-action-button';
import { StarRating } from '../star-rating';

interface CapDetailsHeaderProps {
  capQueryData: RemoteCap;
  downloadedCapData: Cap;
}

export function CapDetailsHeader({
  capQueryData,
  downloadedCapData,
}: CapDetailsHeaderProps) {
  const truncate = (value: string, head = 10, tail = 10) => {
    if (!value) return '';
    return value.length > head + tail
      ? `${value.slice(0, head)}...${value.slice(-tail)}`
      : value;
  };

  const [authorCopied, setAuthorCopied] = useState(false);
  const [cidCopied, setCidCopied] = useState(false);

  const maxInlineTags = 3;
  const allTags = capQueryData.metadata.tags ?? [];
  const displayTags = allTags.slice(0, maxInlineTags);
  const remainingTagsCount = Math.max(allTags.length - displayTags.length, 0);

  return (
    <div className="space-y-6">
      {/* Hero Section with Avatar and Title */}
      <div className="flex flex-col md:flex-row gap-6 items-start rounded-2xl">
        {/* Large Avatar */}
        <div className="flex-shrink-0">
          <CapAvatar
            cap={capQueryData}
            size="9xl"
            className="rounded-2xl shadow-lg"
          />
        </div>

        {/* Title and Basic Info (center column) */}
        <div className="flex-1 text-center md:text-left w-full">
          <div className="flex flex-col items-center md:items-start gap-2 mb-3 w-full">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 w-full">
              <h1 className="text-4xl font-bold mr-1">
                {capQueryData.metadata.displayName}
              </h1>
              {displayTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {displayTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                  {remainingTagsCount > 0 && (
                    <Badge variant="outline" className="gap-1">
                      +{remainingTagsCount} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Structured metadata below title (compact) */}
          <div className="mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* Version (next line) */}
              <div className="flex items-center gap-2 min-w-0">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Version:</span>
                <Badge variant="secondary">v{capQueryData.version}</Badge>
              </div>

              {/* CID (next line) */}
              <div className="flex items-center gap-2 min-w-0">
                <Fingerprint className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">ID:</span>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        asChild
                        variant="outline"
                        className="cursor-pointer select-none"
                      >
                        <button
                          type="button"
                          aria-label="Copy ID"
                          onClick={() => {
                            navigator.clipboard.writeText(capQueryData.id);
                            setCidCopied(true);
                            setTimeout(() => setCidCopied(false), 1500);
                          }}
                        >
                          {truncate(capQueryData.id)}
                        </button>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {cidCopied ? 'Copied' : 'Click to copy'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Validation:
                </span>
                <Badge className="gap-1">Verified</Badge>
              </div>

              {/* Author */}
              <div className="flex items-center gap-2 min-w-0">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Author:</span>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        asChild
                        variant="outline"
                        className="cursor-pointer select-none"
                      >
                        <button
                          type="button"
                          aria-label="Copy author DID"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              downloadedCapData.authorDID,
                            );
                            setAuthorCopied(true);
                            setTimeout(() => setAuthorCopied(false), 1500);
                          }}
                        >
                          {truncate(downloadedCapData.authorDID)}
                        </button>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {authorCopied ? 'Copied' : 'Click to copy'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 justify-center md:justify-start mt-6 mb-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {capQueryData.stats.downloads} views
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {capQueryData.stats.favorites} downloads
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StarRating
                averageRating={capQueryData.stats.averageRating}
                userRating={capQueryData.stats.userRating}
                ratingCount={capQueryData.stats.ratingCount}
                size={16}
                isInteractive={false}
                onRate={() => { }}
              />
            </div>
          </div>

          {/* Tags moved next to the title */}
        </div>

        {/* Right column: vertical actions */}
        <div className="w-full md:w-56 md:ml-auto flex flex-col gap-3">
          <CapActionButton cap={capQueryData} />
          <ShareDialog
            title="Share this CAP"
            description="Copy the link and share it with others."
            links={[
              {
                label: 'CAP URL',
                url: typeof window !== 'undefined' ? window.location.href : '',
                id: 'cap-share-url',
              },
            ]}
          >
            <Button
              variant="outline"
              className="gap-2 w-full"
              aria-label="Share CAP"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </ShareDialog>
        </div>
      </div>
    </div>
  );
}
