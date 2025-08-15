import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NuwaIdentityKit } from '@/shared/services/identity-kit';
import { createPersistConfig, db } from '@/shared/storage';
import type { Cap } from '@/shared/types/cap';
import { generateUUID } from '@/shared/utils';
import type { LocalCap } from '../types';

// get current DID
const getCurrentDID = async () => {
  const { getDid } = await NuwaIdentityKit();
  return await getDid();
};

// Database reference
const capStudioDB = db;

interface CapStudioState {
  // Local caps being developed
  localCaps: LocalCap[];

  // Actions
  createCap: (capData: Cap) => LocalCap;
  updateCap: (id: string, updates: Partial<LocalCap>) => void;
  deleteCap: (id: string) => void;

  // Utility functions
  getCapById: (id: string) => LocalCap | undefined;
  getCapsByTag: (tag: string) => LocalCap[];
  clearAllCaps: () => void;

  // Data persistence
  loadFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
}

const persistConfig = createPersistConfig<CapStudioState>({
  name: 'cap-studio-storage',
  getCurrentDID: getCurrentDID,
  partialize: (state) => ({
    localCaps: state.localCaps,
  }),
  onRehydrateStorage: () => (state?: CapStudioState) => {
    if (state) {
      state.loadFromDB();
    }
  },
});

export const CapStudioStore = create<CapStudioState>()(
  persist(
    (set, get) => ({
      localCaps: [],

      createCap: (capData) => {
        const newCap: LocalCap = {
          capData,
          id: generateUUID(),
          status: 'draft',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          localCaps: [...state.localCaps, newCap],
        }));

        // Save to IndexedDB asynchronously
        get().saveToDB();
        return newCap;
      },

      updateCap: (id, updates) => {
        set((state) => ({
          localCaps: state.localCaps.map((cap) =>
            cap.id === id ? { ...cap, ...updates, updatedAt: Date.now() } : cap,
          ),
        }));

        get().saveToDB();
      },

      deleteCap: (id) => {
        set((state) => ({
          localCaps: state.localCaps.filter((cap) => cap.id !== id),
        }));

        // Delete from IndexedDB asynchronously
        const deleteFromDB = async () => {
          try {
            await capStudioDB.capStudio.delete(id);
          } catch (error) {
            console.error('Failed to delete cap from DB:', error);
          }
        };
        deleteFromDB();
      },

      getCapById: (id) => {
        return get().localCaps.find((cap) => cap.id === id);
      },

      getCapsByTag: (tag) => {
        return get().localCaps.filter((cap) =>
          cap.capData.metadata.tags.includes(tag),
        );
      },

      clearAllCaps: () => {
        set({
          localCaps: [],
        });

        // Clear IndexedDB
        const clearDB = async () => {
          try {
            const currentDID = await getCurrentDID();
            if (!currentDID) return;

            await capStudioDB.capStudio
              .where('did')
              .equals(currentDID)
              .delete();
          } catch (error) {
            console.error('Failed to clear caps from DB:', error);
          }
        };
        clearDB();
      },

      // Data persistence methods
      loadFromDB: async () => {
        if (typeof window === 'undefined') return;

        try {
          const currentDID = await getCurrentDID();
          if (!currentDID) return;

          const caps = await capStudioDB.capStudio
            .where('did')
            .equals(currentDID)
            .toArray();

          const sortedCaps = caps.sort(
            (a: LocalCap, b: LocalCap) => b.updatedAt - a.updatedAt,
          );

          set({
            localCaps: sortedCaps,
          });
        } catch (error) {
          console.error('Failed to load caps from DB:', error);
        }
      },

      saveToDB: async () => {
        if (typeof window === 'undefined') return;

        try {
          const currentDID = await getCurrentDID();
          if (!currentDID) return;

          const { localCaps } = get();
          const capsToSave = localCaps.map((cap) => ({
            ...cap,
            did: currentDID,
          }));
          await capStudioDB.capStudio.bulkPut(capsToSave);
        } catch (error) {
          console.error('Failed to save caps to DB:', error);
        }
      },
    }),
    persistConfig,
  ),
);
