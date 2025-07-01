import { useEffect, useState } from 'react';
import { fetchAvailableModels } from '../services/providers/models';
import type { Model } from '../types';

export function useAvailableModels() {
  const [models, setModels] = useState<Model[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    fetchAvailableModels()
      .then((data: Model[]) => {
        if (isMounted) {
          setModels(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return {
    models,
    loading,
    error,
  };
}
