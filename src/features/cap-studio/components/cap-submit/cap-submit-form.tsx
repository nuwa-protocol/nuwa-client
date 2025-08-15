import { Image as ImageIcon, Loader2, Upload } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui';
import type { CapThumbnail } from '@/shared/types/cap';
import { useSubmitForm } from '../../hooks/use-submit-form';
import type { LocalCap } from '../../types';
import { ProviderAvatar } from '../model-selector/provider-avatar';
import { getModelName, getProviderName } from '../../utils';

interface CapSubmitFormProps {
  cap: LocalCap;
  thumbnail?: CapThumbnail;
  homepage?: string;
  repository?: string;
}

export function CapSubmitForm({
  cap,
  thumbnail,
  homepage,
  repository,
}: CapSubmitFormProps) {
  const { handleCancel, handleDirectSubmit, isSubmitting } = useSubmitForm({
    cap,
  });

  const getThumbnailSrc = () => {
    if (thumbnail?.type === 'file' && thumbnail.file) {
      return thumbnail.file;
    }
    if (thumbnail?.type === 'url' && thumbnail.url) {
      return thumbnail.url;
    }
    return null;
  };

  const thumbnailSrc = getThumbnailSrc();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Submit Cap to Store</h3>
          <p className="text-sm text-muted-foreground">
            Review and confirm the information before publishing @
            {cap.capData.idName} to the Nuwa Cap Store
          </p>
        </div>

        <Button variant="ghost" size="sm" onClick={handleCancel}>
          Cancel
        </Button>
      </div>

      {/* Cap Information - Read Only */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cap Information</CardTitle>
          <CardDescription>Basic information about your cap</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Name
              </div>
              <p className="text-sm">{cap.capData.idName}</p>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Display Name
              </div>
              <p className="text-sm">{cap.capData.metadata.displayName}</p>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              Description
            </div>
            <p className="text-sm">{cap.capData.metadata.description}</p>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              Tags
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {cap.capData.metadata.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Model
              </div>
              <div className="flex items-center gap-2 mt-1">
                <ProviderAvatar provider={cap.capData.core.model.providerName} size="sm" />
                <div>
                  <p className="text-sm font-medium">{getModelName(cap.capData.core.model)}</p>
                  <p className="text-xs text-muted-foreground">{getProviderName(cap.capData.core.model)}</p>
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                MCP Servers
              </div>
              <p className="text-sm">
                {Object.keys(cap.capData.core.mcpServers).length > 0
                  ? Object.keys(cap.capData.core.mcpServers).join(', ')
                  : 'None'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Author Information - Read Only */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Author Information</CardTitle>
          <CardDescription>Author and licensing information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Homepage
              </div>
              <p className="text-sm">{homepage || 'Not provided'}</p>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Repository
              </div>
              <p className="text-sm">{repository || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thumbnail - Read Only */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thumbnail</CardTitle>
          <CardDescription>Cap thumbnail image</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm bg-white dark:bg-slate-800 flex items-center justify-center">
              {thumbnailSrc ? (
                <img
                  src={thumbnailSrc}
                  alt="Thumbnail Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mb-2" />
                  <span className="text-xs">No thumbnail</span>
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {thumbnailSrc
                ? 'Thumbnail ready for submission'
                : 'No thumbnail provided'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <Card className="border-none shadow-none">
        <CardContent>
          <div className="flex items-center justify-between pt-6">
            <div className="text-sm text-muted-foreground">
              Ready to publish your cap to the store
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="lg"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  handleDirectSubmit(thumbnail, homepage, repository)
                }
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit to Store
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
