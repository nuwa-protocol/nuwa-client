import { Description, DialogTitle } from '@radix-ui/react-dialog';
import {
  ArrowDownAZ,
  ArrowDownNarrowWide,
  ArrowDownWideNarrow,
  ArrowUpDown,
  Bot,
  Search,
  Wrench,
} from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { Button } from '@/shared/components';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/shared/components/ui/select';
import { SidebarInset, SidebarProvider } from '@/shared/components/ui/sidebar';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useLocale } from '@/shared/locales/use-locale';
import { useAvailableModels } from '../../../../hooks';
import { ModelCard } from './model-card';
import { ModelSelectorSidebar } from './model-selector-sidebar';
import type { ModelDetails } from './type';
import { generateProviders } from './utils';

export const LLMModelSelector = ({
  onClose,
  gatewayUrl,
  onModelSelect,
}: {
  onClose: () => void;
  gatewayUrl: string;
  onModelSelect: (model: ModelDetails) => void;
}) => {
  const { t } = useLocale();
  const { models, loading, error } = useAvailableModels(gatewayUrl);

  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>(
    'name',
  );
  const [showToolsOnly, setShowToolsOnly] = useState(false);

  // Generate categories and providers from models
  const { providers } = useMemo(() => {
    if (!models) return { providers: [] };
    return generateProviders(models);
  }, [models]);

  const getFilteredModels = () => {
    if (!models) return [];

    let filtered = [...models];

    if (selectedTab === 'provider' && selectedProvider) {
      filtered = filtered.filter((model) => {
        const modelProviderId = model.providerName
          .toLowerCase()
          .replace(/\s+/g, '');
        return modelProviderId === selectedProvider;
      });
    }

    if (searchQuery) {
      const keywords = searchQuery
        .trim()
        .split(/\s+/)
        .filter((keyword) => keyword.length > 0);

      filtered = filtered.filter((model) => {
        const modelName = model.name.toLowerCase();
        const providerName = model.providerName.toLowerCase();
        return keywords.every(
          (keyword) =>
            modelName.includes(keyword.toLowerCase()) ||
            providerName.includes(keyword.toLowerCase()),
        );
      });
    }

    // Filter by tool support if enabled
    if (showToolsOnly) {
      filtered = filtered.filter((model) => model.supports_tools);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-asc': {
          const aPrice =
            a.pricing.input_per_million_tokens +
            a.pricing.output_per_million_tokens;
          const bPrice =
            b.pricing.input_per_million_tokens +
            b.pricing.output_per_million_tokens;
          return aPrice - bPrice;
        }
        case 'price-desc': {
          const aPrice =
            a.pricing.input_per_million_tokens +
            a.pricing.output_per_million_tokens;
          const bPrice =
            b.pricing.input_per_million_tokens +
            b.pricing.output_per_million_tokens;
          return bPrice - aPrice;
        }
        default:
          return 0;
      }
    });

    return filtered;
  };

  const handleModelSelect = (model: ModelDetails) => {
    onClose();
    onModelSelect(model);
  };

  const handleTabChange = (tab: string) => {
    setSelectedTab(tab);
  };

  const getMainContent = () => {
    if (selectedTab === 'provider' && selectedProvider) {
      const filteredModels = getFilteredModels();
      return renderModelGrid(filteredModels);
    }

    const filteredModels = getFilteredModels();
    return renderModelGrid(filteredModels);
  };

  const renderModelGrid = (modelList: ModelDetails[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {modelList.map((model) => (
        <ModelCard key={model.id} model={model} onClick={handleModelSelect} />
      ))}
    </div>
  );

  const getTitle = () => {
    if (selectedTab === 'provider') {
      if (selectedProvider) {
        const provider = providers.find((p) => p.id === selectedProvider);
        return t('aiProvider.modelDialog.title.providerModels', {
          provider: provider?.name,
        });
      }
      return t('aiProvider.modelDialog.title.providers');
    }
    return t('aiProvider.modelDialog.title.allModels');
  };

  if (loading) {
    return (
      <div className="flex h-full">
        <div className="w-64 border-r border-border bg-background p-4">
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full mb-2" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }, () => (
              <Skeleton
                key={Math.random().toString(36)}
                className="h-32 w-full"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-2">
            {t('aiProvider.modelDialog.error.failedToLoad')}
          </p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!models || models.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">
          {t('aiProvider.modelDialog.error.noModelsAvailable')}
        </p>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <ModelSelectorSidebar
        selectedTab={selectedTab}
        selectedProvider={selectedProvider}
        providers={providers}
        onTabChange={handleTabChange}
        onProviderChange={setSelectedProvider}
      />

      <SidebarInset>
        <div className="p-6 border-b border-border h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-2xl font-semibold">{getTitle()}</h2>
          </div>

          <div className="flex gap-2 mx-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('aiProvider.modelDialog.search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tools-only"
                checked={showToolsOnly}
                onCheckedChange={(checked) => setShowToolsOnly(checked as boolean)}
              />
              <label
                htmlFor="tools-only"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1 cursor-pointer"
              >
                <Wrench className="h-4 w-4" />
                Tools Only
              </label>
            </div>
            <Select
              value={sortBy}
              onValueChange={(value) =>
                setSortBy(value as 'name' | 'price-asc' | 'price-desc')
              }
            >
              <SelectTrigger className="w-16 px-3">
                <ArrowUpDown className="size-4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">
                  <div className="flex items-center gap-2">
                    <ArrowDownAZ className="h-4 w-4" />
                    {t('aiProvider.modelDialog.sort.name')}
                  </div>
                </SelectItem>
                <SelectItem value="price-asc">
                  <div className="flex items-center gap-2">
                    <ArrowDownNarrowWide className="h-4 w-4" />
                    {t('aiProvider.modelDialog.sort.priceLowToHigh')}
                  </div>
                </SelectItem>
                <SelectItem value="price-desc">
                  <div className="flex items-center gap-2">
                    <ArrowDownWideNarrow className="h-4 w-4" />
                    {t('aiProvider.modelDialog.sort.priceHighToLow')}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="flex-1 py-4 px-2 h-[calc(80vh-120px)] overflow-auto hide-scrollbar">
            {getMainContent()}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export const ModelSelectorDialog: React.FC<{
  gatewayUrl: string;
  onModelSelect: (model: ModelDetails) => void;
}> = ({ gatewayUrl, onModelSelect }) => {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bot />
          {t('aiProvider.modelSelector.selectModel')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[80vh] p-0 overflow-hidden">
        <DialogTitle className="sr-only">LLM Model Selector</DialogTitle>
        <Description className="sr-only">Select an LLM model.</Description>
        <LLMModelSelector
          onClose={() => setOpen(false)}
          gatewayUrl={gatewayUrl}
          onModelSelect={onModelSelect}
        />
      </DialogContent>
    </Dialog>
  );
};
