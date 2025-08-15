import { CheckSquare, Plus, Search, Send, Trash2, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from '@/shared/components/ui';
import { useLocalCaps } from '../../hooks';
import { useLocalCapsHandler } from '../../hooks/use-local-caps-handler';
import type { LocalCap } from '../../types';
import { DashboardGrid } from '../layout/dashboard-layout';
import { CapCard } from './cap-card';

interface MyCapsProps {
  onEditCap?: (cap: LocalCap) => void;
  onTestCap?: (cap: LocalCap) => void;
  onSubmitCap?: (cap: LocalCap) => void;
  onCreateNew?: () => void;
  onBatchCreate?: (caps: LocalCap[]) => void;
  onBulkDelete?: (caps: LocalCap[]) => void;
  onBulkPublish?: (caps: LocalCap[]) => void;
}

export function MyCaps({
  onEditCap,
  onTestCap,
  onSubmitCap,
  onCreateNew,
  onBatchCreate,
  onBulkDelete,
  onBulkPublish,
}: MyCapsProps) {
  const navigate = useNavigate();
  const localCaps = useLocalCaps();
  const [searchQuery, setSearchQuery] = useState('');
  const { createCap, deleteCap } = useLocalCapsHandler();

  // Multi-select state
  const [selectedCapIds, setSelectedCapIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Multi-select handlers
  const toggleCapSelection = (capId: string) => {
    setSelectedCapIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(capId)) {
        newSet.delete(capId);
      } else {
        newSet.add(capId);
      }
      return newSet;
    });
  };

  const enterMultiSelectMode = () => {
    setIsMultiSelectMode(true);
  };

  const selectAllCaps = () => {
    setSelectedCapIds(new Set(allCaps.map((cap) => cap.id)));
  };

  const clearSelection = () => {
    setSelectedCapIds(new Set());
    setIsMultiSelectMode(false);
  };

  const handleBulkDelete = () => {
    const selectedCaps = allCaps.filter((cap) => selectedCapIds.has(cap.id));
    selectedCaps.forEach((cap) => deleteCap(cap.id));
    if (onBulkDelete) {
      onBulkDelete(selectedCaps);
    }
    clearSelection();
  };

  const handleBulkPublish = () => {
    const selectedCaps = allCaps.filter((cap) => selectedCapIds.has(cap.id));
    selectedCaps.forEach((cap) => {
      if (onSubmitCap) {
        onSubmitCap(cap);
      }
    });
    if (onBulkPublish) {
      onBulkPublish(selectedCaps);
    }
    clearSelection();
  };

  // Get and filter all caps
  const allCaps = useMemo(() => {
    if (!searchQuery) return localCaps;

    const query = searchQuery.toLowerCase();
    return localCaps.filter(
      (cap) =>
        cap.capData.metadata.displayName.toLowerCase().includes(query) ||
        cap.capData.metadata.description.toLowerCase().includes(query) ||
        cap.capData.metadata.tags.some((tag) =>
          tag.toLowerCase().includes(query),
        ),
    );
  }, [localCaps, searchQuery]);

  const selectedCaps = allCaps.filter((cap) => selectedCapIds.has(cap.id));
  const hasSelectedCaps = selectedCaps.length > 0;

  if (localCaps.length === 0) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/25 bg-muted/5">
        <CardHeader className="text-center py-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl text-muted-foreground">
            No Caps Yet
          </CardTitle>
          <CardDescription className="text-base max-w-md mx-auto">
            You haven't created any caps yet. Start building your first
            capability to get started with cap development.
          </CardDescription>
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={onCreateNew} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Cap
            </Button>
            <Button
              onClick={() => navigate('/cap-studio/batch-create')}
              variant="outline"
              size="lg"
            >
              <Upload className="h-4 w-4 mr-2" />
              Batch Create
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex items-center space-x-2">
          {!isMultiSelectMode ? (
            <>
              <Button onClick={onCreateNew} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Cap
              </Button>
              <Button
                onClick={() => navigate('/cap-studio/batch-create')}
                variant="outline"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Batch Create
              </Button>
            </>
          ) : (
            <>
              <Button onClick={clearSelection} variant="outline" size="sm">
                Cancel
              </Button>
              <Button
                onClick={selectAllCaps}
                variant="outline"
                size="sm"
                disabled={allCaps.length === selectedCapIds.size}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Select All ({allCaps.length})
              </Button>
              {selectedCapIds.size > 0 && (
                <>
                  <Button
                    onClick={handleBulkDelete}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedCapIds.size})
                  </Button>
                  {hasSelectedCaps && (
                    <Button
                      onClick={handleBulkPublish}
                      variant="default"
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Publish ({selectedCaps.length})
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search caps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* All Caps */}
      {allCaps.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center py-8">
            <CardTitle className="text-muted-foreground">
              {searchQuery ? 'No matching caps found' : 'No caps yet'}
            </CardTitle>
            <CardDescription>
              {searchQuery
                ? 'Try adjusting your search criteria'
                : 'Create your first cap to get started'}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <DashboardGrid cols={1}>
          {allCaps.map((cap) => (
            <CapCard
              key={cap.id}
              cap={cap}
              onEdit={() => onEditCap?.(cap)}
              onTest={() => onTestCap?.(cap)}
              onSubmit={() => onSubmitCap?.(cap)}
              onUpdate={() => onSubmitCap?.(cap)}
              isMultiSelectMode={isMultiSelectMode}
              isSelected={selectedCapIds.has(cap.id)}
              onToggleSelect={() => toggleCapSelection(cap.id)}
              onEnterMultiSelectMode={() => {
                enterMultiSelectMode();
                toggleCapSelection(cap.id);
              }}
            />
          ))}
        </DashboardGrid>
      )}
    </div>
  );
}
