import { Check, Code, Edit, X } from 'lucide-react';
import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Label,
} from '@/shared/components/ui';
import { DashboardGrid } from '../../layout/dashboard-layout';

interface ArtifactProps {
  form: UseFormReturn<any>;
}

export function Artifact({ form }: ArtifactProps) {
  const navigate = useNavigate();
  const currentUiUrl = form.watch('core.uiUrl') || '';
  const [isEditing, setIsEditing] = useState(!currentUiUrl);
  const [tempUrl, setTempUrl] = useState(currentUiUrl || '');
  const [urlError, setUrlError] = useState<string>('');

  const validateUrl = (url: string): string => {
    if (!url.trim()) {
      return 'UI URL is required';
    }
    try {
      new URL(url);
      return '';
    } catch {
      return 'Please enter a valid URL';
    }
  };

  const handleConfirm = () => {
    const error = validateUrl(tempUrl);
    setUrlError(error);

    if (!error) {
      const valueToSet = tempUrl.trim() === '' ? undefined : tempUrl;
      form.setValue('core.uiUrl', valueToSet, { shouldValidate: true, shouldDirty: true });
      setIsEditing(false);
    }
  };

  const handleEdit = () => {
    setTempUrl(currentUiUrl || '');
    setIsEditing(true);
    setUrlError('');
  };

  const handleCancel = () => {
    setTempUrl(currentUiUrl || '');
    setIsEditing(!currentUiUrl); // If no current URL, stay in editing mode; otherwise, exit editing
    setUrlError('');
  };

  const handleRemove = () => {
    form.setValue('core.uiUrl', undefined, { shouldValidate: true, shouldDirty: true });
    setTempUrl('');
    setIsEditing(true);
  };

  const handleDebug = () => {
    if (currentUiUrl) {
      navigate(
        `/cap-studio/mcp?mcpui=${encodeURIComponent(currentUiUrl)}`,
      );
    }
  };

  return (
    <DashboardGrid cols={1}>
      <FormField
        control={form.control}
        name="core.uiUrl"
        render={() => (
          <FormItem>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Artifact Configuration
                    </CardTitle>
                    <CardDescription>
                      Set the URL for your Cap's artifact
                    </CardDescription>
                  </div>
                  {currentUiUrl && !isEditing && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleEdit}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemove}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Current UI URL Display */}
                {currentUiUrl && !isEditing && (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm">Artifact URL</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {currentUiUrl}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDebug}
                      >
                        <Code className="h-4 w-4" />
                        Debug
                      </Button>
                    </div>
                  </div>
                )}

                {/* Edit/Add Form */}
                {isEditing && (
                  <Card className="border-2 border-dashed">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="ui-url">Artifact URL</Label>
                          <Input
                            placeholder="https://example.com/your-artifact"
                            value={tempUrl}
                            onChange={(e) => {
                              const value = e.target.value;
                              setTempUrl(value);
                              setUrlError(validateUrl(value));
                            }}
                            className={urlError ? 'border-red-500' : ''}
                          />
                          {urlError && (
                            <p className="text-xs text-red-500">{urlError}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-end space-x-2 pt-4">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleConfirm}
                            disabled={!tempUrl.trim()}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Confirm
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!currentUiUrl && !isEditing && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No UI URL configured</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <FormMessage />
          </FormItem>
        )}
      />
    </DashboardGrid>
  );
}
