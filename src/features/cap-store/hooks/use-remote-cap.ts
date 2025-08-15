import { useState } from 'react';
import { useCapKit } from '@/shared/hooks/use-capkit';
import { CapStateStore } from '../stores';
import type { RemoteCap } from '../types';

interface UseRemoteCapParams {
  searchQuery?: string;
  tags?: string[];
  page?: number;
  size?: number;
}
/**
 * Hook for accessing the remote caps with advanced filtering, sorting, and pagination
 */
export function useRemoteCap() {
  const { capKit } = useCapKit();
  const { remoteCaps, setRemoteCaps } = CapStateStore();
  const [lastSearchParams, setLastSearchParams] = useState<UseRemoteCapParams>(
    {},
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCaps = async (params: UseRemoteCapParams = {}) => {
    const {
      searchQuery: queryString = '',
      page: pageNum = 0,
      size: sizeNum = 50,
      tags: tagsArray = [],
    } = params;

    setIsLoading(true);
    setError(null);
    setLastSearchParams(params);

    try {
      if (!capKit) {
        throw new Error('CapKit not initialized');
      }

      const response = await capKit.queryWithName(
        queryString,
        tagsArray,
        pageNum,
        sizeNum,
      );

      const remoteCaps: RemoteCap[] =
        response.data?.items?.map((item) => {
          return {
            cid: item.cid,
            version: item.version,
            id: item.id,
            idName: item.name,
            authorDID: item.id.split(':')[0],
            metadata: {
              displayName: item.displayName,
              description: item.description,
              tags: item.tags,
              repository: item.repository,
              homepage: item.homepage,
              submittedAt: item.submittedAt,
              thumbnail: item.thumbnail,
            },
          };
        }) || [];

      setRemoteCaps(remoteCaps);

      setIsLoading(false);

      return response;
    } catch (err) {
      console.error('Error fetching caps:', err);
      setError('Failed to fetch caps. Please try again.');
      setIsLoading(false);
      throw err;
    }
  };

  const refetch = () => {
    fetchCaps(lastSearchParams);
  };

  const goToPage = (newPage: number) => {
    return fetchCaps({
      searchQuery: '',
      page: newPage,
    });
  };

  return {
    remoteCaps,
    isLoading,
    error,
    fetchCaps,
    goToPage,
    refetch,
  };
}
