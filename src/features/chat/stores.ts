// chat-store.ts
// Store for managing chat sessions and message history with unified storage

import type { Message } from 'ai';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NuwaIdentityKit } from '@/shared/services/identity-kit';
import { createPersistConfig, db } from '@/shared/storage';
import { generateUUID } from '@/shared/utils';
import type { ChatPayment, ChatSession } from './types';

// ================= Constants ================= //
export const createInitialChatSession = (): ChatSession => ({
  id: generateUUID(),
  title: 'New Chat',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
  payments: [],
});

// get current DID
const getCurrentDID = async () => {
  const { getDid } = await NuwaIdentityKit();
  return await getDid();
};

// ================= Database Reference ================= //

const chatDB = db;

// chat store state interface
interface ChatStoreState {
  sessions: Record<string, ChatSession>;

  // session CRUD operations
  getChatSession: (id: string) => ChatSession | null;
  getChatSessionsSortedByUpdatedAt: () => ChatSession[];
  updateSession: (
    id: string,
    updates: Partial<Omit<ChatSession, 'id'>>,
  ) => Promise<void>;
  addPaymentCtxIdToChatSession: (
    id: string,
    payment: ChatPayment,
  ) => Promise<void>;
  deleteSession: (id: string) => void;

  // update messages for a session and create a new session if not founds
  updateMessages: (chatId: string, messages: Message[]) => Promise<void>;

  // utility methods
  clearAllSessions: () => void;

  // data persistence
  loadFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
}

// ================= Persist Configuration ================= //

const persistConfig = createPersistConfig<ChatStoreState>({
  name: 'chat-storage',
  getCurrentDID: getCurrentDID,
  partialize: (state) => ({
    sessions: state.sessions,
  }),
  onRehydrateStorage: () => (state) => {
    if (state) {
      state.loadFromDB();
    }
  },
});

// ================= Store Factory ================= //

export const ChatStateStore = create<ChatStoreState>()(
  persist(
    (set, get) => ({
      sessions: {},

      getChatSession: (id: string) => {
        const { sessions } = get();
        return sessions[id] || null;
      },

      getChatSessionsSortedByUpdatedAt: () => {
        const { sessions } = get();
        return Object.values(sessions).sort(
          (a, b) => b.updatedAt - a.updatedAt,
        );
      },

      updateSession: async (
        id: string,
        updates: Partial<Omit<ChatSession, 'id'>>,
      ) => {
        set((state) => {
          let session = state.sessions[id];
          // if session not found, create new session
          if (!session) {
            session = {
              id: id,
              title: 'New Chat',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              messages: [],
              payments: [],
            };
          }

          const updatedSession = {
            ...session,
            ...updates,
            updatedAt: Date.now(),
          };

          return {
            sessions: {
              ...state.sessions,
              [id]: updatedSession,
            },
          };
        });

        await get().saveToDB();
      },

      addPaymentCtxIdToChatSession: async (
        id: string,
        payment: ChatPayment,
      ) => {
        set((state) => {
          const session = state.sessions[id];
          // if session not found, create new session
          if (!session) {
            const newSession = {
              id: id,
              title: 'New Chat',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              messages: [],
              payments: [payment],
            };

            return {
              sessions: {
                ...state.sessions,
                [id]: newSession,
              },
            };
          } else {
            const updatedSession = {
              ...session,
              payments: [...session.payments, payment],
              updatedAt: Date.now(),
            };

            return {
              sessions: {
                ...state.sessions,
                [id]: updatedSession,
              },
            };
          }
        });

        await get().saveToDB();
      },

      deleteSession: (id: string) => {
        set((state) => {
          const { [id]: deleted, ...restSessions } = state.sessions;
          return {
            sessions: restSessions,
          };
        });

        // async delete related data
        const deleteFromDB = async () => {
          try {
            const currentDID = await getCurrentDID();
            if (!currentDID) return;

            await chatDB.chats
              .where(['did', 'id'])
              .equals([currentDID, id])
              .delete();
          } catch (error) {
            console.error('Failed to delete from DB:', error);
          }
        };
        deleteFromDB();
      },

      updateMessages: async (chatId: string, messages: Message[]) => {
        set((state) => {
          let session = state.sessions[chatId];
          let isNewSession = false;

          // if session not found, create new session
          if (!session) {
            isNewSession = true;
            session = {
              id: chatId,
              title: 'New Chat',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              messages: [],
              payments: [],
            };
          }

          // check if there are new messages to add
          const currentMessageIds = new Set(
            session.messages.map((msg) => msg.id),
          );
          const hasNewMessages = messages.some(
            (msg) => !currentMessageIds.has(msg.id),
          );

          // only update when there are new messages
          if (hasNewMessages || isNewSession) {
            const updatedSession = {
              ...session,
              messages: [...messages], // completely replace message list
              updatedAt: Date.now(),
            };

            const newState = {
              sessions: {
                ...state.sessions,
                [chatId]: updatedSession,
              },
            };

            return newState;
          }

          return state;
        });

        await get().saveToDB();
      },

      clearAllSessions: () => {
        set({
          sessions: {},
        });

        // clear IndexedDB
        const clearDB = async () => {
          try {
            await chatDB.chats.clear();
          } catch (error) {
            console.error('Failed to clear DB:', error);
          }
        };
        clearDB();
      },

      loadFromDB: async () => {
        if (typeof window === 'undefined') return;

        try {
          const currentDID = await getCurrentDID();
          if (!currentDID) return;

          const chats = await chatDB.chats
            .where('did')
            .equals(currentDID)
            .toArray();

          // Sort by updatedAt in descending order
          const sortedChats = chats.sort(
            (a: ChatSession, b: ChatSession) => b.updatedAt - a.updatedAt,
          );
          const sessionsMap: Record<string, ChatSession> = {};

          sortedChats.forEach((chat: ChatSession) => {
            sessionsMap[chat.id] = chat;
          });

          set((state) => ({
            sessions: { ...state.sessions, ...sessionsMap },
          }));
        } catch (error) {
          console.error('Failed to load from DB:', error);
        }
      },

      saveToDB: async () => {
        if (typeof window === 'undefined') return;

        try {
          const currentDID = await getCurrentDID();
          if (!currentDID) return;

          const { sessions } = get();
          const chatsToSave = Object.values(sessions).map((session) => ({
            ...session,
            did: currentDID,
          }));

          // use bulkPut to efficiently update data
          await chatDB.chats.bulkPut(chatsToSave);
        } catch (error) {
          console.error('Failed to save to DB:', error);
        }
      },
    }),
    persistConfig,
  ),
);
