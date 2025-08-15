import { CapKit } from '@nuwa-ai/cap-kit';
import { useEffect, useState } from 'react';
import { NuwaIdentityKit } from '../services/identity-kit';

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
            '0xdc2a3eba923548660bb642b9df42936941a03e2d8bab223ae6dda6318716e742',
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
