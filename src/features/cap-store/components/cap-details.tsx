import { format } from 'date-fns';
import { Copy, Home, Play, Star, Tag, Download, Heart, BadgeCheck } from 'lucide-react';
import { useEffect, useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Badge,
  Button,
  Card,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui';
import { useCopyToClipboard } from '@/shared/hooks/use-copy-to-clipboard';
import { useCapStore } from '../hooks/use-cap-store';
import { CapAvatar } from './cap-avatar';
import { useCapStoreModal } from './cap-store-modal-context';
import { StarRating } from './star-rating';
import { useCapKit } from '@/shared/hooks/use-capkit';
import { useSEO, generateCapSEO } from '@/shared/hooks/use-seo';
import { StructuredData, generateSoftwareApplicationSchema } from '@/shared/components/structured-data';

export function CapDetails() {
  const { runCap, rateCap, addCapToFavorite, removeCapFromFavorite, isCapFavorite, fetchFavoriteStatus } =
    useCapStore();
    const { capKit } = useCapKit();
  const { selectedCap: cap } = useCapStoreModal();
  const [isLoading, setIsLoading] = useState(false);
  const [copyToClipboard, isCopied] = useCopyToClipboard();
  const navigate = useNavigate();
  const [isFetchingFavorite, setIsFetchingFavorite] = useState(true);
  const structuredDataId = useId();
  
  // Update SEO when cap data changes
  useSEO(cap ? generateCapSEO(cap) : {});
  
  useEffect(() => {
    if (cap && capKit) {
      fetchFavoriteStatus(cap.capData.id);
      setIsFetchingFavorite(false);
    }
  }, [cap?.capData.id, capKit]);

  if (!cap) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p>Cap not found, please try again</p>
        <Button onClick={() => navigate('/chat')}>
          <Home className="h-4 w-4" />
          Home
        </Button>
      </div>
    );
  }

  const handleRateCap = async (rating: number) => {
    try {
      await rateCap(cap.capData.id, rating);
      toast.success(`You rated ${cap.capData.metadata.displayName} ${rating} stars!`);
    } catch (error) {
      toast.error('Failed to submit your rating. Please try again.');
    }
  };

  const handleRunCap = async () => {
    setIsLoading(true);
    try {
      await runCap(cap.capData.id, {
        version: cap.version, capCid: cap.cid, stats: cap.stats
      }
      );
      navigate('/chat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = () => {
    if (isCapFavorite(cap.capData.id)) {
      removeCapFromFavorite(cap.capData.id);
      toast.success(
        `Removed ${cap.capData.metadata.displayName} from favorites`,
      );
    } else {
      addCapToFavorite(cap.capData.id, cap.version, cap.cid, cap.stats);
      toast.success(`Added ${cap.capData.metadata.displayName} to favorites`);
    }
  };

  const formatDate = (timestamp: number | string | undefined) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) return 'Unknown';
      return format(date, 'MMM d, yyyy');
    } catch {
      return 'Unknown';
    }
  };

  const handleCopyAuthor = async () => {
    if (cap?.capData.authorDID) {
      await copyToClipboard(cap.capData.authorDID);
      toast.success('Author DID copied to clipboard!');
    }
  };

  const truncateAuthor = (did: string) => {
    if (did.length > 16) {
      return `${did.slice(0, 8)}...${did.slice(-8)}`;
    }
    return did;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Structured Data for SEO */}
      {cap && (
        <StructuredData 
          data={generateSoftwareApplicationSchema(cap)}
          id={structuredDataId}
        />
      )}
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 mb-4 hide-scrollbar">
        <div className="max-w-6xl mx-auto">
          {/* Main Layout: Left Content + Right Information Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Content Area */}
            <div className="lg:col-span-4 space-y-6">
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row gap-6 justify-between items-start">
                {/* Left side of header */}
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <CapAvatar
                      capName={cap.capData.metadata.displayName}
                      capThumbnail={cap.capData.metadata.thumbnail}
                      size="xl"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold break-words">
                        {cap.capData.metadata.displayName}
                      </h1>
                      <Badge variant="outline" className="text-sm">
                        v {cap.version + 1}
                      </Badge>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="secondary"
                              className="gap-1.5 text-green-600 border-green-600/50"
                            >
                              <BadgeCheck className="h-4 w-4" />
                              Verified
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              This Cap Server has passed installation
                              verification, ensuring its quality and reliability.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      {cap.capData.id && (
                        <p className="font-mono break-all">
                          @{cap.capData.idName}
                        </p>
                      )}
                      {cap.capData.id && <span>·</span>}
                      <div>
                        {`Published on ${formatDate(cap.capData.metadata.submittedAt)}`}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-3">
                      {/* Tags */}
                      {cap.capData.metadata.tags &&
                        cap.capData.metadata.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              Tags:
                            </span>
                            {cap.capData.metadata.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="gap-1"
                              >
                                <Tag className="h-3 w-3" />
                                <span className="truncate">{tag}</span>
                              </Badge>
                            ))}
                          </div>
                        )}
                    </div>
                    {/* Action Buttons */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={handleRunCap}
                        disabled={isLoading}
                        className="gap-2"
                      >
                        <Play className="h-4 w-4" />
                        {isLoading ? 'Running...' : 'Run Cap'}
                      </Button>
                      {isCapFavorite(cap.capData.id) ? (
                        <Button
                          variant="outline"
                          onClick={handleToggleFavorite}
                          className="gap-2 group"
                        >
                          <Star className="h-4 w-4 fill-current text-yellow-500" />
                          <span className="group-hover:hidden">Favorited</span>
                          <span className="hidden group-hover:inline">
                            Remove
                          </span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={handleToggleFavorite}
                          disabled={isFetchingFavorite}
                          className="gap-2"
                        >
                          <Star className="h-4 w-4" />
                          Add to Favorites
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side of header */}
                <div className="flex flex-col gap-4 sm:items-end flex-shrink-0">
                  {/* Author Badge */}
                  {cap.capData.authorDID && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Author:
                      </span>
                      <Badge
                        variant={isCopied ? 'default' : 'outline'}
                        className="gap-2 cursor-pointer hover:bg-accent"
                        onClick={handleCopyAuthor}
                      >
                        <Copy className="h-3 w-3 flex-shrink-0" />
                        <span className="font-mono truncate">
                          {isCopied
                            ? 'Copied!'
                            : truncateAuthor(cap.capData.authorDID)}
                        </span>
                      </Badge>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{cap.stats.downloads}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{cap.stats.favorites}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating
                        averageRating={cap.stats.averageRating}
                        userRating={cap.stats.userRating}
                        ratingCount={cap.stats.ratingCount}
                        size={16}
                        isInteractive
                        onRate={handleRateCap}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              {cap.capData.metadata.description && (
                <div>
                  <h2 className="text-xl font-semibold mb-3">Description</h2>
                  <p className="text-muted-foreground leading-relaxed text-base break-words">
                    {cap.capData.metadata.description}
                  </p>
                </div>
              )}

              {/* Details Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Configuration</h2>
                <Card className="p-6">
                  <Tabs defaultValue="prompt" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="prompt">Prompt</TabsTrigger>
                      <TabsTrigger value="model">Model</TabsTrigger>
                      <TabsTrigger value="mcp">MCP Servers</TabsTrigger>
                    </TabsList>

                    <TabsContent value="prompt" className="mt-4">
                      <div className="space-y-3 bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
                        <p className="text-muted-foreground break-words whitespace-pre-wrap font-mono text-sm">
                          {typeof cap.capData.core.prompt === 'string'
                            ? cap.capData.core.prompt
                            : cap.capData.core.prompt?.value ||
                            'No prompt configured.'}
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="model" className="mt-4">
                      <div className="max-h-96 overflow-y-auto">
                        {cap.capData.core.model ? (
                          <div className="space-y-4">
                            {/* Model Name and Provider */}
                            <div className="p-4 bg-muted rounded-lg">
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-muted-foreground flex-shrink-0">
                                  Model Name:
                                </span>
                                <span className="font-medium text-right break-words">
                                  {cap.capData.core.model.name}
                                </span>
                              </div>
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-muted-foreground flex-shrink-0">
                                  Provider Name:
                                </span>
                                <span className="font-medium text-right break-words">
                                  {cap.capData.core.model.providerName}
                                </span>
                              </div>
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-muted-foreground flex-shrink-0">
                                  Input Price:
                                </span>
                                <span className="font-medium text-right break-words">
                                  $
                                  {Number(
                                    cap.capData.core.model.pricing.input_per_million_tokens.toPrecision(
                                      3,
                                    ),
                                  )}
                                  {' / 1M Tokens'}
                                </span>
                              </div>
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-muted-foreground flex-shrink-0">
                                  Output Price:
                                </span>
                                <span className="font-medium text-right break-words">
                                  $
                                  {Number(
                                    cap.capData.core.model.pricing.output_per_million_tokens.toPrecision(
                                      3,
                                    ),
                                  )}
                                  {' / 1M Tokens'}
                                </span>
                              </div>
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-muted-foreground flex-shrink-0">
                                  Context Length:
                                </span>
                                <span className="font-medium text-right break-words">
                                  {cap.capData.core.model.contextLength}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">
                            No model configuration available.
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="mcp" className="mt-4">
                      <div className="max-h-96 overflow-y-auto">
                        {cap.capData.core.mcpServers &&
                          Object.keys(cap.capData.core.mcpServers).length > 0 ? (
                          <div className="space-y-3">
                            {Object.entries(cap.capData.core.mcpServers).map(
                              ([name, server]: [
                                string,
                                {
                                  url: string;
                                  transport: string;
                                },
                              ]) => (
                                <div
                                  key={name}
                                  className="flex justify-between items-center p-3 bg-muted rounded-lg gap-2 min-w-0"
                                >
                                  <span className="font-medium truncate">
                                    {name}
                                  </span>
                                  <span className="font-mono truncate">
                                    {server.url}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="flex-shrink-0"
                                  >
                                    {server.transport || 'Unknown'}
                                  </Badge>
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">
                            No MCP servers configured.
                          </p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
