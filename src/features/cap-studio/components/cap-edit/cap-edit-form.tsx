import { AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react';
import { useState } from 'react';
import type { LocalCap } from '@/features/cap-studio/types';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from '@/shared/components/ui';
import type { CapThumbnail } from '@/shared/types/cap';
import { useEditForm } from '../../hooks/use-edit-form';
import { DashboardGrid } from '../layout/dashboard-layout';
import { ModelSelectorDialog } from '../model-selector';
import { CapTags } from './cap-tags';
import { McpServersConfig } from './mcp-servers-config';
import { ModelDetails } from './model-details';
import { PromptEditor } from './prompt-editor';
import { ThumbnailUpload } from './thumbnail-upload';

interface CapEditFormProps {
  editingCap?: LocalCap;
}

export function CapEditForm({ editingCap }: CapEditFormProps) {
  const [thumbnail, setThumbnail] = useState<CapThumbnail>(
    editingCap?.capData.metadata.thumbnail || null,
  );
  const {
    form,
    handleFormSave,
    handleFormCancel,
    handleUpdateMcpServers,
    isSaving,
    selectedModel,
    mcpServers,
  } = useEditForm({
    editingCap,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {editingCap ? 'Edit Cap' : 'Create New Cap'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {editingCap ? 'Update your Cap' : 'Build a new Cap from scratch'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={handleFormCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSaving}
            onClick={() =>
              form.handleSubmit((data) => handleFormSave(data, thumbnail))()
            }
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {editingCap ? 'Update Cap' : 'Create Cap'}
              </>
            )}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) =>
            handleFormSave(data, thumbnail),
          )}
          className="space-y-6"
        >
          <DashboardGrid cols={1}>
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Information</CardTitle>
                <CardDescription>
                  Essential details about your cap
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="idName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <p className="text-sm text-muted-foreground mb-2">
                        Unique identifier for your cap.
                      </p>
                      <FormControl>
                        <Input placeholder="my-awesome_cap" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <p className="text-sm text-muted-foreground mb-2">
                        Human-readable name shown in the store.
                      </p>
                      <FormControl>
                        <Input placeholder="My Awesome Cap" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what your cap does..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <p className="text-sm text-muted-foreground mb-2">
                        Select one or more tags that describe your cap.
                      </p>
                      <FormControl>
                        <CapTags
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Search tags..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Model Configuration (use Model Selector) */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Model Configuration
                    </CardTitle>
                    <CardDescription>
                      Choose the AI model for your cap
                    </CardDescription>
                  </div>
                  <ModelSelectorDialog />
                </div>
              </CardHeader>
              <CardContent>
                {!selectedModel ? (
                  <div className="text-muted-foreground text-sm">
                    No model selected
                  </div>
                ) : (
                  <ModelDetails model={selectedModel} />
                )}
              </CardContent>
            </Card>
          </DashboardGrid>

          {/* Prompt Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Prompt Configuration
                  </CardTitle>
                  <CardDescription>
                    This prompt will guide the AI model's behavior when using
                    your cap
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <PromptEditor
                        value={field.value.value}
                        onChange={(value) =>
                          field.onChange({ ...field.value, value })
                        }
                        suggestions={field.value.suggestions || []}
                        onSuggestionsChange={(suggestions) =>
                          field.onChange({ ...field.value, suggestions })
                        }
                        placeholder="Enter your prompt instructions here..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* MCP Servers */}
          <McpServersConfig
            mcpServers={mcpServers}
            onUpdateMcpServers={handleUpdateMcpServers}
            capId={editingCap?.id}
          />

          {/* Author Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Author Information</CardTitle>
              <CardDescription>
                Information about the cap author and licensing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="homepage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Homepage (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Link to your cap's homepage or documentation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="repository"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repository (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://github.com/user/repo"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Link to the source code repository
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Thumbnail */}
          <ThumbnailUpload
            thumbnail={thumbnail}
            onThumbnailChange={setThumbnail}
          />

          {/* Submit */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center space-x-2 text-sm">
              {Object.keys(form.formState.errors).length === 0 ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Cap configuration is valid</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    {Object.keys(form.formState.errors).length} error
                    {Object.keys(form.formState.errors).length > 1 ? 's' : ''}{' '}
                    found
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" onClick={handleFormCancel}>
                  Cancel
                </Button>
              </div>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingCap ? 'Update Cap' : 'Create Cap'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
