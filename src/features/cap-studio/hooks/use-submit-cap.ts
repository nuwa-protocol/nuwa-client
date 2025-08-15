import { useCallback } from 'react';
import { useCapKit } from '@/shared/hooks/use-capkit';
import type { Cap } from '@/shared/types/cap';

interface CapSubmitResponse {
  success: boolean;
  capId?: string;
  message: string;
  errors?: string[];
}

export const useSubmitCap = () => {
  const { capKit } = useCapKit();

  const submitCap = useCallback(
    async (capData: Cap): Promise<CapSubmitResponse> => {
      try {
        if (!capKit) {
          throw new Error('Failed to initialize CapKit');
        }

        // Register the capability using CapKit
        const cid = await capKit.registerCap(capData);

        return {
          success: true,
          capId: cid,
          message: `Capability "@${capData.idName}" registered successfully with CID: ${cid}`,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to submit capability';
        return {
          success: false,
          message: errorMessage,
          errors: [errorMessage],
        };
      }
    },
    [capKit],
  );

  return {
    submitCap,
  };
};
