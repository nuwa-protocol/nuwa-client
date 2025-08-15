import { db } from './db';

class StorageActions {
  private isBrowser = typeof window !== 'undefined';

  // Sync state to localStorage cache
  async syncToCache<T>(key: string, data: T): Promise<void> {
    if (!this.isBrowser) return;

    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to sync to cache [${key}]:`, error);
    }
  }

  // Read from localStorage cache
  async syncFromCache<T>(key: string): Promise<T | null> {
    if (!this.isBrowser) return null;

    try {
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Failed to sync from cache [${key}]:`, error);
      return null;
    }
  }

  // Save to IndexedDB storage layer
  async saveToStorage<T extends { id: string; did: string }>(
    table: string,
    records: T[],
  ): Promise<void> {
    if (!this.isBrowser || records.length === 0) return;

    try {
      const dbTable = (db as any)[table];
      if (dbTable) {
        await dbTable.bulkPut(records);
      }
    } catch (error) {
      console.error(`Failed to save to storage [${table}]:`, error);
    }
  }

  // Load from IndexedDB storage layer
  async loadFromStorage<T>(table: string, did: string): Promise<T[]> {
    if (!this.isBrowser || !did) return [];

    try {
      const dbTable = (db as any)[table];
      if (dbTable) {
        const records = await dbTable.where('did').equals(did).toArray();
        return records.sort((a: any, b: any) => b.updatedAt - a.updatedAt);
      }
      return [];
    } catch (error) {
      console.error(`Failed to load from storage [${table}]:`, error);
      return [];
    }
  }

  // Delete from IndexedDB
  async deleteFromStorage(
    table: string,
    condition: string | { key: string; value: any },
  ): Promise<void> {
    if (!this.isBrowser) return;

    try {
      const dbTable = (db as any)[table];
      if (dbTable) {
        if (typeof condition === 'string') {
          await dbTable.delete(condition);
        } else {
          await dbTable.where(condition.key).equals(condition.value).delete();
        }
      }
    } catch (error) {
      console.error(`Failed to delete from storage [${table}]:`, error);
    }
  }

  // Clear all storage
  async clearAllStorage(): Promise<void> {
    if (!this.isBrowser) return;

    try {
      // Clear IndexedDB
      await db.transaction(
        'rw',
        [db.chats, db.capStore, db.settings, db.capStudio],
        async () => {
          await Promise.all([
            db.chats.clear(),
            db.capStore.clear(),
            db.settings.clear(),
            db.capStudio.clear(),
          ]);
        },
      );

      // Clear localStorage
      const keysToRemove = Object.keys(localStorage).filter(
        (key) => key.includes('storage') || key.includes('nuwa'),
      );
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear all storage:', error);
    }
  }
}

export const storageActions = new StorageActions();
