import { useCallback } from 'react';
import { useCapKitInit } from '@/shared/hooks';
import type { LocalCap } from '../types';

interface CapSubmitRequest {
  name: string;
  description: string;
  cap: LocalCap;
  metadata: {
    tag: string;
    author: string;
    homepage?: string;
    repository?: string;
    changelog?: string;
  };
}

interface CapSubmitResponse {
  success: boolean;
  capId?: string;
  message: string;
  errors?: string[];
}

export const useSubmitCap = () => {
  const { initializeCapKit, isInitializing } = useCapKitInit();

  const submitCap = useCallback(
    async (request: CapSubmitRequest): Promise<CapSubmitResponse> => {
      try {
        const kit = await initializeCapKit();
        if (!kit) {
          throw new Error('Failed to initialize CapKit');
        }

        // Register the capability using CapKit
        const cid = await kit.registerCap(request.name, request.description, {
          version: '1.0.0',
          capabilities: [request.metadata.tag],
        });

        return {
          success: true,
          capId: cid,
          message: `Capability "${request.name}" registered successfully with CID: ${cid}`,
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
    [initializeCapKit],
  );

  return {
    submitCap,
    isInitializing,
  };
};
