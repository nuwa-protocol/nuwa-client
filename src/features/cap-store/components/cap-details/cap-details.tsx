import { ChevronLeft, Github, Globe, Info, Settings, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Markdown } from '@/shared/components/markdown';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui';
import { capKitService } from '@/shared/services/capkit-service';
import { InstalledCapsStore } from '@/shared/stores/installed-caps-store';
import type { Cap } from '@/shared/types';
import { useCapStore } from '../../stores';
import type { RemoteCap } from '../../types';
import { mapResultToRemoteCap } from '../../utils';
import { CapDetailsConfiguration } from './cap-details-configuration';
import { CapDetailsHeader } from './cap-details-header';
import { CapDetailsLoadingSkeleton } from './cap-details-loading-skeleton';
import { CapDetailsRating } from './cap-details-rating';
import { CapDetailsRecommendations } from './cap-details-recommendations';

export function CapDetails({ capId }: { capId: string }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [downloadedCapData, setDownloadedCapData] = useState<Cap | null>(null);
  const [capQueryData, setCapQueryData] = useState<RemoteCap | null>(null);
  const [isCapFavorite, setIsCapFavorite] = useState<boolean>(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState<boolean>(false);
  const { downloadCapByIDWithCache } = useCapStore();

  // Fetch full cap data when selectedCap changes
  useEffect(() => {
    setIsLoading(true);
    setDownloadedCapData(null);
    setCapQueryData(null);
    const fetchCap = async () => {
      try {
        const downloadedCap = await downloadCapByIDWithCache(capId);
        console.log('downloadedCap', downloadedCap);
        setDownloadedCapData(downloadedCap);
      } catch (error) {
        console.error('Failed to download cap data:', error);
        toast.error('Failed to find the cap.');
        navigate('/explore');
      }
    };

    const fetchFavoriteStatus = async () => {
      const capKit = await capKitService.getCapKit();

      try {
        const favoriteStatus = await capKit.install(capId, 'isInstall');
        console.log('favoriteStatus', favoriteStatus);
        setIsCapFavorite(favoriteStatus.data ?? false);
      } catch (error) {
        console.error('Failed to fetch installed status:', error);
      }
    };

    const queryCap = async () => {
      const capKit = await capKitService.getCapKitRestful();

      try {
        const queriedCap = await capKit.queryCap(capId);
        setCapQueryData(mapResultToRemoteCap(queriedCap));
      } catch (error) {
        console.error('Failed to download cap data:', error);
        toast.error('Failed to find the cap.');
        navigate('/explore');
      }
    };

    Promise.all([fetchCap(), fetchFavoriteStatus(), queryCap()]).finally(() => {
      setIsLoading(false);
    });
  }, [capId]);

  if (isLoading || !downloadedCapData || !capQueryData) {
    return <CapDetailsLoadingSkeleton />;
  }

  const handleRateCap = async (rating: number) => {
    const capKit = await capKitService.getCapKit();

    toast.promise(capKit.rateCap(capId, rating), {
      loading: 'Submitting your rating...',
      success: async (data) => {
        const queriedCap = await capKit.queryByID({ id: capId });
        setCapQueryData(mapResultToRemoteCap(queriedCap));
        return `You rated ${capQueryData.metadata.displayName} ${rating} stars!`;
      },
      error: () => {
        return 'Failed to submit your rating. Please try again.';
      },
    });
  };

  const introduction = capQueryData.metadata.introduction?.trim();

  return (
    <div className="flex flex-col w-full h-full">
      {/* Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
          {/* Back Button */}
          <div className="-mt-2">
            <Button
              variant="ghost"
              className="gap-2 group hover:-translate-x-0.5 transition-transform duration-150"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ChevronLeft className="h-4 w-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
              Back
            </Button>
          </div>
          {/* Header Section with Hero Layout */}
          <CapDetailsHeader
            capQueryData={capQueryData}
            downloadedCapData={downloadedCapData}
          />

          {/* Tabs + Content/Grid */}
          <Tabs defaultValue="overview" className="w-full">
            {/* Full-width Tab List */}
            <TabsList className="w-full p-0 bg-background justify-start border-b rounded-none mb-4">
              <TabsTrigger
                value="overview"
                className="rounded-none bg-background h-full data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Info className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="ratings"
                className="rounded-none bg-background h-full data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Star className="w-4 h-4 mr-2" />
                Ratings
              </TabsTrigger>
              <TabsTrigger
                value="configuration"
                className="rounded-none bg-background h-full data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configuration
              </TabsTrigger>
              {/* External links (GitHub/Homepage) */}
              <div className="ml-auto flex items-center gap-2 pr-2">
                {capQueryData.metadata.repository ? (
                  <a
                    href={capQueryData.metadata.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${capQueryData.metadata.displayName} repository`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                ) : null}
                {capQueryData.metadata.homepage ? (
                  <a
                    href={capQueryData.metadata.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${capQueryData.metadata.displayName} homepage`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                ) : null}
              </div>
            </TabsList>

            {/* Below the tab list: content 2/3, recommendations 1/3 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Tab Content (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                <TabsContent value="overview" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">About This Cap</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {introduction ? (
                        <Markdown className="">
                          {introduction}
                        </Markdown>
                      ) : (
                        <p className="text-muted-foreground leading-relaxed text-base">
                          No overview provided.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ratings" className="mt-0">
                  <CapDetailsRating
                    capQueryData={capQueryData}
                    onRate={handleRateCap}
                  />
                </TabsContent>

                <TabsContent value="configuration" className="mt-0">
                  <CapDetailsConfiguration
                    downloadedCapData={downloadedCapData}
                  />
                </TabsContent>
              </div>

              {/* Right: Recommendations (1/3) */}
              <CapDetailsRecommendations
                currentCapId={capId}
                tags={capQueryData.metadata.tags}
              />
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
