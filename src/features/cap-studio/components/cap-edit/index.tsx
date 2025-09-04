import { Loader2, Save } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Button,
  Form,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui';
import { useLocalCaps } from '../../hooks';
import { useEditForm } from '../../hooks/use-edit-form';
import { getErrorDescription } from '../../utils';
import { DashboardLayout } from '../layout/dashboard-layout';
import { Artifact } from './artifact';
import { GeneralTab } from './general';
import { McpTab } from './mcp';
import { ModelTab } from './model';
import { PromptTab } from './prompt';

export function CapEdit() {
  const { id } = useParams();
  const localCaps = useLocalCaps();
  const editingCap = id ? localCaps.find((cap) => cap.id === id) : undefined;

  const { form, handleFormSave, handleFormCancel, isSaving } = useEditForm({
    editingCap,
  });

  return (
    <DashboardLayout>
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
              onClick={form.handleSubmit(
                (data) => handleFormSave(data),
                (error) => {
                  toast.error('Please complete the fields or fix the errors', {
                    description: getErrorDescription(error),
                  });
                  console.error(error);
                },
              )}
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
            onSubmit={form.handleSubmit((data) => handleFormSave(data))}
            className="space-y-6"
          >
            <Tabs defaultValue="general" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="model">Model</TabsTrigger>
                <TabsTrigger value="prompt">Prompt</TabsTrigger>
                <TabsTrigger value="artifact">Artifact</TabsTrigger>
                <TabsTrigger value="mcp">MCP</TabsTrigger>
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general" className="space-y-6">
                <GeneralTab form={form} />
              </TabsContent>

              {/* Model Tab */}
              <TabsContent value="model" className="space-y-6">
                <ModelTab form={form} />
              </TabsContent>

              {/* Prompt Tab */}
              <TabsContent value="prompt" className="space-y-6">
                <PromptTab form={form} />
              </TabsContent>

              {/* UI Tab */}
              <TabsContent value="artifact" className="space-y-6">
                <Artifact form={form} />
              </TabsContent>

              {/* MCP Tab */}
              <TabsContent value="mcp" className="space-y-6">
                <McpTab form={form} />
              </TabsContent>
            </Tabs>

            {/* Submit - Always visible at bottom */}
            <div className="flex items-end justify-end pt-6 border-t">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" onClick={handleFormCancel}>
                    Cancel
                  </Button>
                </div>
                <Button
                  type="button"
                  disabled={isSaving}
                  onClick={form.handleSubmit(
                    (data) => handleFormSave(data),
                    (error) => {
                      toast.error(
                        'Please complete the fields or fix the errors',
                        {
                          description: getErrorDescription(error),
                        },
                      );
                      console.error(error);
                    },
                  )}
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
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
