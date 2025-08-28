import { formatDistanceToNow } from 'date-fns';
import {
  Bot,
  Bug,
  Check,
  Clock,
  Copy,
  Edit,
  MoreVertical,
  Server,
  Share,
  Trash2,
  Upload,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui';
import { ShareDialog } from '@/shared/components/ui/shadcn-io/share-dialog';
import { APP_URL } from '@/shared/config/app';
import { useLocalCapsHandler } from '../../hooks/use-local-caps-handler';
import type { LocalCap } from '../../types';

interface CapCardProps {
  cap: LocalCap;
  onEdit?: () => void;
  onTest?: () => void;
  onSubmit?: () => void;
  onUpdate?: () => void;
  isMultiSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onEnterMultiSelectMode?: () => void;
}

export function CapCard({
  cap,
  onEdit,
  onTest,
  onSubmit,
  onUpdate,
  isMultiSelectMode,
  isSelected,
  onToggleSelect,
  onEnterMultiSelectMode,
}: CapCardProps) {
  const { deleteCap } = useLocalCapsHandler();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const handleDelete = () => {
    deleteCap(cap.id);
    setShowDeleteDialog(false);
  };

  const handleCopyCid = async () => {
    if (cap.cid) {
      await navigator.clipboard.writeText(cap.cid);
      toast.success(`Published CID copied: ${cap.cid}`);
    }
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect();
    }
  };

  const handleCardClick = () => {
    if (!isMultiSelectMode && onEnterMultiSelectMode) {
      onEnterMultiSelectMode();
    } else if (isMultiSelectMode && onToggleSelect) {
      onToggleSelect();
    }
  };

  const mcpServerCount = Object.keys(cap.capData.core.mcpServers).length;
  const lastUpdated = formatDistanceToNow(new Date(cap.updatedAt), {
    addSuffix: true,
  });

  // Determine border color based on published status
  const borderColor =
    cap.status === 'submitted'
      ? 'border-l-theme-primary/50'
      : 'border-l-primary/20';

  return (
    <Card
      className={`
        hover:shadow-md transition-all duration-200 border-l-4 
        ${borderColor}
        cursor-pointer
        group
      `}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {(isMultiSelectMode || isHovered) && (
            <div className="flex items-center">
              <button
                type="button"
                className={`
                  w-4 h-4 border-2 rounded flex items-center justify-center transition-all
                  ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground hover:border-primary'}
                  ${!isMultiSelectMode && isHovered ? 'opacity-70 hover:opacity-100' : ''}
                `}
                onClick={handleSelectClick}
              >
                {isSelected && (
                  <Check className="h-3 w-3 text-primary-foreground" />
                )}
              </button>
            </div>
          )}
          <div className="flex items-start space-x-4 flex-1 min-w-0">
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
              <Avatar className="rounded-lg">
                <AvatarImage
                  src={
                    cap.capData.metadata.thumbnail?.type === 'file'
                      ? cap.capData.metadata.thumbnail.file
                      : cap.capData.metadata.thumbnail?.url
                  }
                />
                <AvatarFallback>
                  {cap.capData.metadata.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-base truncate">
                  {cap.capData.metadata.displayName}
                </h3>
              </div>

              <p className="text-sm text-muted-foreground mb-2 line-clamp-2 break-words overflow-hidden">
                {cap.capData.metadata.description}
              </p>

              <div className="flex items-center space-x-4 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center">
                  <Bot className="h-3 w-3 mr-1" />
                  {cap.capData.core.model.name}
                </div>
                <div className="flex items-center">
                  <Server className="h-3 w-3 mr-1" />
                  {mcpServerCount} MCP server{mcpServerCount !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {lastUpdated}
                </div>
              </div>
            </div>
          </div>

          {!isMultiSelectMode && (
            <div className="flex items-center space-x-2 shrink-0">
              <div className="flex grid grid-cols-1 gap-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.();
                  }}
                  size="sm"
                  variant="default"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>

                {cap.status === 'draft' ? (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSubmit?.();
                    }}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Publish
                  </Button>
                ) : (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate?.();
                    }}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Update
                  </Button>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {cap.id && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareDialogOpen(true);
                      }}
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                  )}

                  {cap.status === 'submitted' && cap.cid && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCid();
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Published CID
                    </DropdownMenuItem>
                  )}

                  {cap.status === 'submitted' && <DropdownMenuSeparator />}

                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onTest?.();
                    }}
                  >
                    <Bug className="h-4 w-4 mr-2" />
                    Test Cap
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Cap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cap</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete @{cap.capData.idName}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        title={`Share ${cap.capData.metadata.displayName}`}
        description="Share this published cap with others using this link."
        links={[
          {
            id: 'share',
            label: 'Share Link',
            url: `${APP_URL}/chat?capid=${cap.id}`,
          },
        ]}
      />
    </Card>
  );
}
