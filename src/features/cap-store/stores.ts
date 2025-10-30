import type { Cap, Page, Result, ResultCap } from '@nuwa-ai/cap-kit';
import { create } from 'zustand';
import { capKitService } from '@/shared/services/capkit-service';
import type { CapStoreSection, RemoteCap } from './types';
import { mapResultsToRemoteCaps } from './utils';

// Search parameters interface
export interface UseRemoteCapParams {
  searchQuery?: string;
  tags?: string[];
  page?: number;
  size?: number;
  sortBy?:
    | 'average_rating'
    | 'downloads'
    | 'favorites'
    | 'rating_count'
    | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}

// Home data structure
export interface HomeData {
  topRated: RemoteCap[];
  trending: RemoteCap[];
  latest: RemoteCap[];
}

interface CapStoreState {
  // UI State (from context)
  isInitialized: boolean;

  // Remote cap management
  remoteCaps: RemoteCap[];
  isFetching: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMoreData: boolean;
  currentPage: number;
  lastSearchParams: UseRemoteCapParams;

  // Home data management
  homeData: HomeData;
  isLoadingHome: boolean;
  homeError: string | null;

  //downloaded caps management
  downloadedCaps: Record<string, Cap>;

  // UI Actions (from context)
  initialize: () => Promise<void>;

  // Main actions
  fetchCaps: (
    params?: UseRemoteCapParams,
    append?: boolean,
  ) => Promise<Result<Page<ResultCap>>>;
  refetch: () => void;
  loadMore: () => Promise<any> | undefined;
  goToPage: (newPage: number) => Promise<any>;
  fetchHome: () => Promise<HomeData | null>;
  downloadCapByIDWithCache: (id: string) => Promise<Cap>;
}

const initialActiveSection: CapStoreSection = {
  id: 'home',
  label: 'Home',
  type: 'section' as const,
};

const initialState = {
  // UI State
  activeSection: initialActiveSection,
  selectedCap: null,
  isInitialized: false,

  // Remote cap management
  remoteCaps: [],
  isFetching: false,
  isLoadingMore: false,
  error: null,
  hasMoreData: true,
  currentPage: 1,
  lastSearchParams: {},

  // Home data
  homeData: {
    topRated: [],
    trending: [],
    latest: [],
  },

  // Installed/Favorites moved to InstalledCapsStore
  isLoadingHome: false,
  homeError: null,

  //downloaded caps management
  downloadedCaps: {},
};

export const useCapStore = create<CapStoreState>()((set, get) => {
  // Auto-initialize when store is created
  const initialize = async () => {
    const { isInitialized, fetchCaps, fetchHome } = get();
    if (isInitialized) return;

    const capKit = await capKitService.getCapKit();
    if (!capKit) return;

    set({ isInitialized: true });

    // Initial data fetching
    await Promise.all([fetchCaps(), fetchHome()]);
  };

  // Call initialize immediately when store is created
  setTimeout(() => initialize(), 0);

  return {
    ...initialState,

    // Initialize method (can still be called manually if needed)
    initialize,

    // Main fetch functions
    fetchCaps: async (
      params: UseRemoteCapParams = {},
      append = false,
    ): Promise<Result<Page<ResultCap>>> => {
      const capKitRestful = await capKitService.getCapKitRestful();

      const {
        searchQuery: queryString = '',
        page: pageNum = 0,
        size: sizeNum = 45,
        tags: tagsArray = [],
        sortBy: sortByParam = 'downloads',
        sortOrder: sortOrderParam = 'desc',
      } = params;

      if (append) {
        set({ isLoadingMore: true });
      } else {
        set({ currentPage: 0, isFetching: true, hasMoreData: true });
      }
      set({ error: null, lastSearchParams: params });

      try {
        const response = await capKitRestful.queryCaps(queryString, 
          tagsArray,
          pageNum,
          sizeNum,
          sortByParam,
          sortOrderParam,
        );

        const newRemoteCaps: RemoteCap[] = mapResultsToRemoteCaps(response);

        const totalItems = response.data?.items?.length || 0;
        const { remoteCaps } = get();

        set({
          hasMoreData: totalItems === sizeNum,
          remoteCaps: append
            ? [...remoteCaps, ...newRemoteCaps]
            : newRemoteCaps,
          currentPage: pageNum,
          isFetching: false,
          isLoadingMore: false,
        });

        return response;
      } catch (err) {
        console.error('Error fetching caps:', err);
        set({
          error: 'Please check your network connection and try again.',
          isFetching: false,
          isLoadingMore: false,
        });
        throw err;
      }
    },

    refetch: () => {
      const { lastSearchParams, fetchCaps } = get();
      fetchCaps(lastSearchParams);
    },

    loadMore: () => {
      const {
        hasMoreData,
        isLoadingMore,
        currentPage,
        lastSearchParams,
        fetchCaps,
      } = get();
      if (!hasMoreData || isLoadingMore) return;

      const nextPage = currentPage + 1;
      return fetchCaps(
        {
          ...lastSearchParams,
          page: nextPage,
        },
        true,
      );
    },

    goToPage: (newPage: number) => {
      const { fetchCaps } = get();
      return fetchCaps({
        searchQuery: '',
        page: newPage,
      });
    },

    fetchHome: async (): Promise<HomeData | null> => {
      const { fetchCaps } = get();

      set({ isLoadingHome: true, homeError: null });

      try {
        const [topRatedResponse, trendingResponse, latestResponse] =
          await Promise.all([
            fetchCaps({
              searchQuery: '',
              sortBy: 'average_rating',
              sortOrder: 'desc',
              page: 0,
              size: 6,
            }) as Promise<Result<Page<ResultCap>>>,
            fetchCaps({
              searchQuery: '',
              sortBy: 'downloads',
              sortOrder: 'desc',
              page: 0,
              size: 6,
            }) as Promise<Result<Page<ResultCap>>>,
            fetchCaps({
              searchQuery: '',
              sortBy: 'updated_at',
              sortOrder: 'desc',
              page: 0,
              size: 6,
            }) as Promise<Result<Page<ResultCap>>>,
          ]).catch((e) => {
            throw e;
          });
        const homeData: HomeData = {
          topRated: mapResultsToRemoteCaps(topRatedResponse),
          trending: mapResultsToRemoteCaps(trendingResponse),
          latest: mapResultsToRemoteCaps(latestResponse),
        };

        set({ homeData, isLoadingHome: false });
        return homeData;
      } catch (err) {
        console.error('Error fetching home data:', err);
        set({
          homeError: 'Failed to load home data. Please try again.',
          isLoadingHome: false,
        });
        throw err;
      }
    },

    downloadCapByIDWithCache: async (id: string): Promise<Cap> => {
      const cachedCap = get().downloadedCaps[id];
      if (cachedCap) {
        return cachedCap;
      }
      const capKit = await capKitService.getCapKitRestful();
      const cap = await capKit.downloadCap(id);
      set({ downloadedCaps: { ...get().downloadedCaps, [id]: cap } });
      return cap;
    },
  };
});
