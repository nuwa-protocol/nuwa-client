// chat-store.ts
// Store for managing chat sessions and message history with unified storage

import type { Message } from 'ai';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NuwaIdentityKit } from '@/features/auth/services';
import { generateUUID } from '@/shared/utils';
import { createPersistConfig, db } from '@/storage';
import type { ChatSession } from '../types';

// ================= Constants ================= //
export const createInitialChatSession = (): ChatSession => ({
  id: generateUUID(),
  title: 'New Chat',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
  cap: null,
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
  createSession: (session?: Partial<ChatSession>) => ChatSession;
  readSession: (id: string) => ChatSession | null;
  updateSession: (
    id: string,
    updates: Partial<Omit<ChatSession, 'id'>>,
  ) => void;
  deleteSession: (id: string) => void;

  // update messages for a session
  updateMessages: (sessionId: string, messages: Message[]) => void;
  
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

      // Session CRUD operations
      createSession: (session?: Partial<ChatSession>) => {
        const newSession: ChatSession = {
          id: session?.id || generateUUID(),
          title: session?.title || 'New Chat',
          createdAt: session?.createdAt || Date.now(),
          updatedAt: Date.now(),
          messages: session?.messages || [],
          cap: session?.cap || null,
        };

        set((state) => ({
          sessions: {
            ...state.sessions,
            [newSession.id]: newSession,
          },
        }));

        get().saveToDB();
        return newSession;
      },

      readSession: (id: string) => {
        const { sessions } = get();
        return sessions[id] || null;
      },

      updateSession: (
        id: string,
        updates: Partial<Omit<ChatSession, 'id'>>,
      ) => {
        set((state) => {
          const session = state.sessions[id];
          if (!session) return state;

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

        get().saveToDB();
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
            await chatDB.streams
              .where(['did', 'chatId'])
              .equals([currentDID, id])
              .delete();
          } catch (error) {
            console.error('Failed to delete from DB:', error);
          }
        };
        deleteFromDB();
      },

      updateMessages: (sessionId: string, messages: Message[]) => {
        set((state) => {
          let session = state.sessions[sessionId];
          let isNewSession = false;

          // if session not found, create new session
          if (!session) {
            isNewSession = true;
            session = {
              id: sessionId,
              title: 'New Chat',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              messages: [],
              cap: null,
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
                [sessionId]: updatedSession,
              },
            };

            return newState;
          }

          return state;
        });

        get().saveToDB();
      },



      clearAllSessions: () => {
        set({
          sessions: {},
        });

        // clear IndexedDB
        const clearDB = async () => {
          try {
            await chatDB.chats.clear();
            await chatDB.streams.clear();
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
          const { sessions } = get();
          const chatsToSave = Object.values(sessions);

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