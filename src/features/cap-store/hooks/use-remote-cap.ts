import { useCallback } from 'react';
import { useCapKit } from '@/shared/hooks/use-capkit';
import { CapStateStore, type UseRemoteCapParams } from '../stores';
import type { InstalledCap, RemoteCap } from '../types';

/**
 * Hook for accessing the remote caps with advanced filtering, sorting, and pagination
 */
export function useRemoteCap() {
  const { capKit } = useCapKit();
  const {
    remoteCaps,
    isFetching,
    isLoadingMore,
    error,
    hasMoreData,
    currentPage,
    lastSearchParams,
    setRemoteCaps,
    setIsFetching,
    setIsLoadingMore,
    setError,
    setHasMoreData,
    setCurrentPage,
    setLastSearchParams,
    installedCaps,
    addInstalledCap,
  } = CapStateStore();

  const fetchCaps = useCallback(
    async (params: UseRemoteCapParams = {}, append = false) => {
      if (!capKit) {
        return;
      }

      console.log('fetchCaps', params);

      const {
        searchQuery: queryString = '',
        page: pageNum = 0,
        size: sizeNum = 45,
        tags: tagsArray = [],
      } = params;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setCurrentPage(0);
        setIsFetching(true);
        setHasMoreData(true);
      }
      setError(null);
      setLastSearchParams(params);

      try {
        const response = await capKit.queryWithName(
          queryString,
          tagsArray,
          pageNum,
          sizeNum,
        );

        const newRemoteCaps: RemoteCap[] =
          response.data?.items
            ?.filter((item) => {
              return item.displayName !== 'nuwa_test';
            })
            .map((item) => {
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

        // Check if we have more data
        const totalItems = response.data?.items?.length || 0;
        setHasMoreData(totalItems === sizeNum);

        if (append) {
          setRemoteCaps([...remoteCaps, ...newRemoteCaps]);
          setCurrentPage(pageNum);
        } else {
          setRemoteCaps(newRemoteCaps);
          setCurrentPage(pageNum);
        }

        setIsFetching(false);
        setIsLoadingMore(false);

        return response;
      } catch (err) {
        console.error('Error fetching caps:', err);
        setError('Failed to fetch caps. Please try again.');
        setIsFetching(false);
        setIsLoadingMore(false);
        throw err;
      }
    },
    [
      capKit,
      remoteCaps,
      setRemoteCaps,
      setIsFetching,
      setIsLoadingMore,
      setError,
      setHasMoreData,
      setCurrentPage,
      setLastSearchParams,
    ],
  );

  const refetch = () => {
    fetchCaps(lastSearchParams);
  };

  const loadMore = () => {
    if (!hasMoreData || isLoadingMore) return;

    const nextPage = currentPage + 1;
    return fetchCaps(
      {
        ...lastSearchParams,
        page: nextPage,
      },
      true,
    );
  };

  const goToPage = (newPage: number) => {
    return fetchCaps({
      searchQuery: '',
      page: newPage,
    });
  };

  const downloadCap = useCallback(
    async (remoteCap: RemoteCap): Promise<InstalledCap | null> => {
      if (!capKit) {
        return null;
      }

      // check if cap is already installed
      const installedCap = installedCaps[remoteCap.id];
      if (installedCap) {
        console.log('cap is already installed', installedCap);
        return installedCap;
      }

      // download cap if not installed
      const downloadedCap = await capKit.downloadCapWithCID(remoteCap.cid);
      await addInstalledCap({
        cid: remoteCap.cid,
        capData: downloadedCap,
        isFavorite: false,
        lastUsedAt: null,
      });
      return {
        cid: remoteCap.cid,
        capData: downloadedCap,
        isFavorite: false,
        lastUsedAt: null,
      };
    },
    [capKit, installedCaps, addInstalledCap],
  );

  return {
    remoteCaps,
    isFetching,
    isLoadingMore,
    hasMoreData,
    error,
    fetchCaps,
    loadMore,
    goToPage,
    refetch,
    downloadCap,
  };
}
