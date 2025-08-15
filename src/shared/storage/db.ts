import Dexie, { type Table } from 'dexie';

class Database extends Dexie {
  chats!: Table<any>;
  capStore!: Table<any>;
  settings!: Table<any>;
  capStudio!: Table<any>;

  constructor() {
    if (typeof window === 'undefined') {
      super('dummy');
      return;
    }

    super('NuwaClientDB');

    this.version(1).stores({
      chats: 'id, did, createdAt, updatedAt',
      capStore: ' id,did',
      settings: 'did',
      capStudio: 'id, did, createdAt, updatedAt',
    });
  }
}

export const db = new Database();
