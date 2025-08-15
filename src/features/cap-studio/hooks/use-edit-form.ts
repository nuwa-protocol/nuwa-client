import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuth } from '@/features/auth/hooks';
import type { CapMcpServerConfig, CapThumbnail } from '@/shared/types/cap';
import type { LocalCap } from '../types';
import { useLocalCapsHandler } from './use-local-caps-handler';
import { useSelectedModel } from './use-selected-model';

const capSchema = z.object({
  idName: z
    .string()
    .min(6, 'Name must be at least 6 characters')
    .max(20, 'Name must be at most 20 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Name must contain only letters, numbers, and underscores',
    ),
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name too long'),
  description: z
    .string()
    .min(20, 'Description must be at least 10 characters')
    .max(500, 'Description too long'),
  tags: z.array(z.string()),
  prompt: z.object({
    value: z.string(),
    suggestions: z.array(z.string()).optional(),
  }),
  homepage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  repository: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
});

type CapFormData = z.infer<typeof capSchema>;

interface UseEditFormProps {
  editingCap?: LocalCap;
}

export const useEditForm = ({ editingCap }: UseEditFormProps) => {
  const navigate = useNavigate();
  const { did } = useAuth();
  const { createCap, updateCap } = useLocalCapsHandler();
  const { selectedModel, setSelectedModel } = useSelectedModel();
  const [isSaving, setIsSaving] = useState(false);
  const [mcpServers, setMcpServers] = useState<
    Record<string, CapMcpServerConfig>
  >({});

  const form = useForm<CapFormData>({
    resolver: zodResolver(capSchema),
    mode: 'onChange',
    defaultValues: {
      idName: editingCap?.capData.idName || '',
      displayName: editingCap?.capData.metadata.displayName || '',
      description: editingCap?.capData.metadata.description || '',
      tags: editingCap?.capData.metadata.tags || [],
      prompt: {
        value:
          typeof editingCap?.capData.core.prompt === 'string'
            ? editingCap.capData.core.prompt
            : editingCap?.capData.core.prompt?.value || '',
        suggestions:
          typeof editingCap?.capData.core.prompt === 'object'
            ? editingCap.capData.core.prompt.suggestions
            : [],
      },
      homepage: editingCap?.capData.metadata.homepage || '',
      repository: editingCap?.capData.metadata.repository || '',
    },
  });

  useEffect(() => {
    if (editingCap) {
      setMcpServers(editingCap.capData.core.mcpServers || {});
      // Set the selected model to the cap's configured model
      if (editingCap.capData.core.model) {
        setSelectedModel(editingCap.capData.core.model);
      }
    }
  }, [editingCap, setSelectedModel]);

  const handleUpdateMcpServers = (
    servers: Record<string, CapMcpServerConfig>,
  ) => {
    setMcpServers(servers);
  };

  const handleUpdateCap = async (
    editingCap: LocalCap,
    data: CapFormData,
    thumbnail?: CapThumbnail,
  ) => {
    // Update existing cap
    updateCap(editingCap.id, {
      capData: {
        id: `${did}:${data.idName}`,
        authorDID: did || '',
        idName: data.idName,
        metadata: {
          displayName: data.displayName,
          description: data.description,
          tags: data.tags,
          submittedAt: 0,
          thumbnail:
            thumbnail !== undefined
              ? thumbnail
              : editingCap.capData.metadata.thumbnail || null,
          homepage: data.homepage || undefined,
          repository: data.repository || undefined,
        },
        core: {
          prompt: data.prompt,
          model: selectedModel,
          mcpServers,
        },
      },
    });

    toast.success(`${data.displayName} has been updated successfully`);

    navigate('/cap-studio');
  };

  const handleCreateCap = async (
    data: CapFormData,
    thumbnail?: CapThumbnail,
  ) => {
    // Create new cap
    createCap({
      id: `${did}:${data.idName}`,
      authorDID: did || '',
      idName: data.idName,
      metadata: {
        displayName: data.displayName,
        description: data.description,
        tags: data.tags,
        submittedAt: 0,
        thumbnail: thumbnail || null,
        homepage: data.homepage || undefined,
        repository: data.repository || undefined,
      },
      core: {
        prompt: data.prompt,
        model: selectedModel,
        mcpServers,
      },
    });

    toast.success(`${data.displayName} has been created successfully`);

    navigate('/cap-studio');
  };

  const handleFormSave = async (
    data: CapFormData,
    thumbnail?: CapThumbnail,
  ) => {
    // Trigger validation for all fields
    const isValid = await form.trigger();

    if (!isValid) {
      toast.warning('Please fix all validation errors before saving');
      return;
    }

    if (!selectedModel) {
      toast.warning('Please select a model for this cap');
      return;
    }

    setIsSaving(true);
    try {
      if (editingCap) {
        // Update existing cap
        handleUpdateCap(editingCap, data, thumbnail);
      } else {
        handleCreateCap(data, thumbnail);
      }
    } catch (error) {
      toast.error('Failed to save cap. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormCancel = () => {
    navigate('/cap-studio');
  };

  return {
    form,
    handleFormSave,
    handleFormCancel,
    handleUpdateMcpServers,
    selectedModel,
    mcpServers,
    isSaving,
  };
};
