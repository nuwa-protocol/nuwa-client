import { CapKit } from '@nuwa-ai/cap-kit';
import { useEffect, useState } from 'react';
import { NuwaIdentityKit } from '../services/identity-kit';
import { CapContractAddress } from '../constants/cap';

export const useCapKit = () => {
  const [capKit, setCapKit] = useState<CapKit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeCapKit = async () => {
      try {
        const keyManager = await NuwaIdentityKit().getKeyManager();

        const newCapKit = new CapKit({
          roochUrl: 'https://test-seed.rooch.network',
          mcpUrl: 'https://test-cap.nuwa.dev/mcp',
          contractAddress:
          CapContractAddress,
          signer: keyManager,
        });

        setCapKit(newCapKit);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to initialize CapKit:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeCapKit();
  }, []);

  return {
    capKit,
    isLoading,
    error,
  };
};
