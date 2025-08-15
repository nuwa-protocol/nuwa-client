import { Image as ImageIcon, Link, Upload, X } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui';
import type { CapThumbnail } from '@/shared/types/cap';

interface ThumbnailUploadProps {
  thumbnail: CapThumbnail;
  onThumbnailChange: (thumbnail: CapThumbnail) => void;
}

export function ThumbnailUpload({
  thumbnail,
  onThumbnailChange,
}: ThumbnailUploadProps) {
  const thumbnailUploadId = useId();
  const [inputUrl, setInputUrl] = useState(thumbnail?.url || '');
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>(
    thumbnail?.type === 'url' ? 'url' : 'upload',
  );

  const handleThumbnailUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        toast.error('Thumbnail size must be less than 2MB');
        return;
      }

      try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        onThumbnailChange({
          type: 'file',
          file: base64,
        });
      } catch (error) {
        toast.error('Failed to process image file');
        console.error('File conversion error:', error);
      }
    }
  };

  const handleUrlSubmit = () => {
    if (!inputUrl.trim()) {
      toast.error('Please enter a valid image URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(inputUrl);
    } catch {
      toast.error('Please enter a valid URL format');
      return;
    }

    onThumbnailChange({
      type: 'url',
      url: inputUrl.trim(),
    });
    toast.success('Image URL has been set');
  };

  const handleRemoveThumbnail = () => {
    onThumbnailChange(null);
    setInputUrl('');
  };

  const getThumbnailSrc = () => {
    if (thumbnail?.type === 'file' && thumbnail.file) {
      // For base64, the URL is the base64 string itself
      return thumbnail.file;
    }
    if (thumbnail?.type === 'url' && thumbnail.url) {
      return thumbnail.url;
    }
    return null;
  };

  const hasThumbnail = thumbnail !== null;
  const thumbnailSrc = getThumbnailSrc();

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          Thumbnail
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          Upload a file or enter an image URL to set your Cap thumbnail
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Thumbnail Preview */}
        <div className="flex items-start gap-6">
          <div className="relative group">
            {hasThumbnail ? (
              <div className="w-32 h-32 rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm bg-white dark:bg-slate-800">
                <img
                  src={thumbnailSrc!}
                  alt="Thumbnail Preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={() => {
                    toast.error(
                      'Failed to load image, please check if the URL is valid',
                    );
                    onThumbnailChange(null);
                    setInputUrl('');
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleRemoveThumbnail}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <ImageIcon className="h-10 w-10 text-slate-400 dark:text-slate-500" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'upload' | 'url')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800">
                <TabsTrigger
                  value="upload"
                  className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </TabsTrigger>
                <TabsTrigger
                  value="url"
                  className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
                >
                  <Link className="h-4 w-4" />
                  Image URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-4 space-y-3">
                <Input
                  id={thumbnailUploadId}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                />
                <label htmlFor={thumbnailUploadId}>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-accent dark:hover:bg-slate-700 transition-colors"
                    asChild
                  >
                    <span className="flex items-center justify-center gap-2 py-6">
                      <Upload className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                      <span className="text-slate-600 dark:text-slate-300">
                        Click to select image file
                      </span>
                    </span>
                  </Button>
                </label>
              </TabsContent>

              <TabsContent value="url" className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="flex-1 border-slate-300 dark:border-slate-600 focus:border-blue-400 dark:focus:border-blue-500 focus:ring-blue-400 dark:focus:ring-blue-500 dark:bg-slate-800 dark:text-slate-200"
                  />
                  <Button
                    type="button"
                    onClick={handleUrlSubmit}
                    disabled={!inputUrl.trim()}
                  >
                    Set
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p>• Supported formats: PNG, JPG, WebP, GIF</p>
              <p>• File size: Maximum 2MB</p>
              <p>• Recommended size: 400×400px or 1:1 ratio</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
