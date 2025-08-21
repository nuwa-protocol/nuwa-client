import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import type { CapThumbnail } from '@/shared/types/cap';
import { useLocalCapsHandler } from '../hooks/use-local-caps-handler';
import { useSubmitCap } from '../hooks/use-submit-cap';
import type { LocalCap } from '../types';

const submitSchema = z.object({
  homepage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  repository: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
});

export type SubmitFormData = z.infer<typeof submitSchema>;

interface UseSubmitFormProps {
  cap: LocalCap;
}

export const useSubmitForm = ({ cap }: UseSubmitFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { updateCap } = useLocalCapsHandler();
  const { submitCap } = useSubmitCap();

  const handleCancel = () => {
    navigate('/cap-studio');
  };

  const handleDirectSubmit = async (
    thumbnail?: CapThumbnail,
    homepage?: string,
    repository?: string,
  ) => {
    setIsSubmitting(true);

    const submitFormData = {
      homepage: homepage || '',
      repository: repository || '',
    };

    try {
      const capWithSubmitFormData = {
        ...cap.capData,
        metadata: {
          ...cap.capData.metadata,
          homepage: submitFormData.homepage || undefined,
          repository: submitFormData.repository || undefined,
          submittedAt: Date.now(),
          thumbnail: thumbnail || null,
        },
      };

      // make the submission
      const result = await submitCap(capWithSubmitFormData);

      if (!result.success) {
        const error = result.errors?.[0] as any;
        const errorMessage = error instanceof Error
          ? error.message
          : 'Failed to submit cap. Please try again.';
        toast.error(errorMessage);

        navigate('/cap-studio');
        return;
      }

      // update cap status to submitted
      updateCap(cap.id, {
        status: 'submitted',
        cid: result.capId,
        capData: capWithSubmitFormData,
      });

      toast.success(result.message);

      navigate('/cap-studio');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to submit cap. Please try again.';
      toast.error(errorMessage);

      navigate('/cap-studio');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleCancel,
    handleDirectSubmit,
    isSubmitting,
  };
};
