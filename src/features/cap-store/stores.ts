// cap-store.ts
// Store for managing capability (Cap) states
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultCap } from '@/shared/constants/cap';
import { NuwaIdentityKit } from '@/shared/services/identity-kit';
import { createPersistConfig, db } from '@/shared/storage';
import type { InstalledCap, RemoteCap } from './types';

// Search parameters interface
export interface UseRemoteCapParams {
  searchQuery?: string;
  tags?: string[];
  page?: number;
  size?: number;
}

// ================= Interfaces ================= //

// Cap store state interface - handles both installed and remote caps
interface CapStoreState {
  // Installed cap management use capId as key
  installedCaps: Record<string, InstalledCap>;

  // Remote cap management
  remoteCaps: RemoteCap[];
  isFetching: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMoreData: boolean;
  currentPage: number;
  lastSearchParams: UseRemoteCapParams;

  // Installed Cap management
  addInstalledCap: (cap: InstalledCap) => void;
  updateInstalledCap: (
    id: string,
    updates: Partial<Omit<InstalledCap, 'capData'>>,
  ) => void;
  clearAllInstalledCaps: () => void;

  // Remote cap management
  setRemoteCaps: (caps: RemoteCap[]) => void;
  setIsFetching: (fetching: boolean) => void;
  setIsLoadingMore: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasMoreData: (hasMore: boolean) => void;
  setCurrentPage: (page: number) => void;
  setLastSearchParams: (params: UseRemoteCapParams) => void;

  // Data persistence
  loadFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
}

// ================= Constants ================= //

// get current DID
const getCurrentDID = async () => {
  const { getDid } = await NuwaIdentityKit();
  return await getDid();
};

// Database reference
const capDB = db;

// ================= Persist Configuration ================= //

const persistConfig = createPersistConfig<CapStoreState>({
  name: 'cap-storage',
  getCurrentDID: getCurrentDID,
  partialize: (state) => ({
    installedCaps: state.installedCaps,
  }),
  onRehydrateStorage: () => (state?: CapStoreState) => {
    if (state) {
      state.loadFromDB();
    }
  },
});

// ================= Store Definition ================= //

export const CapStateStore = create<CapStoreState>()(
  persist(
    (set, get) => ({
      // Store state
      installedCaps: {
        [defaultCap.id]: {
          cid: defaultCap.id,
          capData: defaultCap,
          isFavorite: false,
          lastUsedAt: null,
        },
      },

      remoteCaps: [],
      isFetching: false,
      isLoadingMore: false,
      error: null,
      hasMoreData: true,
      currentPage: 0,
      lastSearchParams: {},

      // Installation management
      addInstalledCap: (cap: InstalledCap) => {
        const { installedCaps } = get();

        // Don't install if already installed
        if (installedCaps[cap.capData.id]) {
          return;
        }

        set((state) => ({
          installedCaps: {
            ...state.installedCaps,
            [cap.capData.id]: {
              cid: cap.cid,
              capData: cap.capData,
              isFavorite: cap.isFavorite,
              lastUsedAt: cap.lastUsedAt,
            },
          },
        }));

        // Save to IndexedDB asynchronously
        get().saveToDB();
      },

      // Data management
      updateInstalledCap: (
        id: string,
        updates: Partial<Omit<InstalledCap, 'capData'>>,
      ) => {
        const { installedCaps } = get();
        const installedCap = installedCaps[id];

        if (!installedCap) return;

        set((state) => ({
          installedCaps: {
            ...state.installedCaps,
            [id]: {
              ...installedCap,
              ...updates,
            },
          },
        }));

        get().saveToDB();
      },

      clearAllInstalledCaps: () => {
        set({
          installedCaps: {},
        });

        // Clear IndexedDB
        const clearDB = async () => {
          try {
            const currentDID = await getCurrentDID();
            if (!currentDID) return;

            await capDB.capStore.where('did').equals(currentDID).delete();
          } catch (error) {
            console.error('Failed to clear caps from DB:', error);
          }
        };
        clearDB();
      },

      // Remote cap management
      setRemoteCaps: (caps: RemoteCap[]) => {
        set({ remoteCaps: caps });
      },

      setIsFetching: (fetching: boolean) => {
        set({ isFetching: fetching });
      },

      setIsLoadingMore: (loading: boolean) => {
        set({ isLoadingMore: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setHasMoreData: (hasMore: boolean) => {
        set({ hasMoreData: hasMore });
      },

      setCurrentPage: (page: number) => {
        set({ currentPage: page });
      },

      setLastSearchParams: (params: UseRemoteCapParams) => {
        set({ lastSearchParams: params });
      },

      // Data persistence methods
      loadFromDB: async () => {
        if (typeof window === 'undefined') return;

        try {
          const currentDID = await getCurrentDID();
          if (!currentDID) return;

          const installedCaps = await capDB.capStore
            .where('did')
            .equals(currentDID)
            .toArray();

          const installedCapsMap: Record<string, InstalledCap> = {};

          installedCaps.forEach((installedCap: any) => {
            const { id, ...capData } = installedCap;
            installedCapsMap[id] = {
              cid: capData.cid,
              capData: capData.capData,
              isFavorite: capData.isFavorite,
              lastUsedAt: capData.lastUsedAt,
            };
          });

          set((state) => ({
            installedCaps: { ...state.installedCaps, ...installedCapsMap },
          }));
        } catch (error) {
          console.error('Failed to load caps from DB:', error);
        }
      },

      saveToDB: async () => {
        if (typeof window === 'undefined') return;

        try {
          const currentDID = await getCurrentDID();
          if (!currentDID) return;

          const { installedCaps } = get();
          const capsToSave = Object.entries(installedCaps).map(([id, cap]) => ({
            id,
            ...cap,
            did: currentDID,
          }));
          await capDB.capStore.bulkPut(capsToSave);
        } catch (error) {
          console.error('Failed to save caps to DB:', error);
        }
      },
    }),
    persistConfig,
  ),
);
