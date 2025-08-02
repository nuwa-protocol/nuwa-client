import { CapKit } from '@nuwa-ai/cap-kit';
import { createSelfDid, TestEnv } from '@nuwa-ai/identity-kit';
import { useCallback, useState } from 'react';

export const useCapKitInit = () => {
  const [capKit, setCapKit] = useState<CapKit | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const initializeCapKit = useCallback(async () => {
    if (capKit || isInitializing) return capKit;

    setIsInitializing(true);
    try {
      // Initialize the environment
      const env = await TestEnv.bootstrap({
        rpcUrl: 'https://test-seed.rooch.network',
        network: 'test',
        debug: false,
      });

      // Create a DID signer
      const { signer } = await createSelfDid(env, {
        customScopes: ['0xcontract::*::*'],
      });

      // Initialize CapKit
      const newCapKit = new CapKit({
        roochUrl: 'https://test-seed.rooch.network',
        mcpUrl: 'https://nuwa-production-a276.up.railway.app',
        contractAddress:
          '0xdc2a3eba923548660bb642b9df42936941a03e2d8bab223ae6dda6318716e742',
        signer,
      });

      setCapKit(newCapKit);
      return newCapKit;
    } catch (error) {
      console.error('Failed to initialize CapKit:', error);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  }, [capKit, isInitializing]);

  return {
    capKit,
    isInitializing,
    initializeCapKit,
  };
};
