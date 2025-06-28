// chat-store.ts
// Store for managing chat sessions and message history with unified storage

import type { Message } from "ai";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateTitleFromUserMessage } from "../services";
import { NuwaIdentityKit } from "@/features/auth/services";
import { generateUUID } from "@/shared/utils";
import { createPersistConfig, db } from "@/storage";
import type { ChatSession, StreamRecord } from "../types";

// ================= Constants ================= //
export const createInitialChatSession = (): ChatSession => ({
  id: generateUUID(),
  title: "New Chat",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
});

// get current DID
const getCurrentDID = async () => {
  const { getDid } = await NuwaIdentityKit();
  return await getDid();
};


// ================= Database Reference ================= //

// 使用统一数据库，不再需要单独的ChatDatabase
const chatDB = db;

// chat store state interface
interface ChatStoreState {
  sessions: Record<string, ChatSession>;
  
  // session management
  getSession: (id: string) => ChatSession | null;
  updateSession: (
    id: string,
    updates: Partial<Omit<ChatSession, "id">>
  ) => void;
  deleteSession: (id: string) => void;

  // message management
  updateMessages: (sessionId: string, messages: Message[]) => void;
  updateSingleMessage: (
    sessionId: string,
    messageId: string,
    updates: Partial<Message>
  ) => void;
  deleteMessage: (sessionId: string, messageId: string) => void;
  deleteMessagesAfterTimestamp: (sessionId: string, timestamp: number) => void;
  getMessages: (sessionId: string) => Message[];

  // stream management
  createStreamId: (streamId: string, chatId: string) => Promise<void>;
  getStreamIdsByChatId: (chatId: string) => Promise<string[]>;

  // tool methods
  updateTitle: (chatId: string) => Promise<void>;
  clearAllSessions: () => void;

  // data persistence
  loadFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
}

// ================= Persist Configuration ================= //

const persistConfig = createPersistConfig<ChatStoreState>({
  name: "chat-storage",
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

      getSession: (id: string) => {
        const { sessions } = get();
        return sessions[id] || null;
      },

      updateSession: (
        id: string,
        updates: Partial<Omit<ChatSession, "id">>
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
              .where(["did", "id"])
              .equals([currentDID, id])
              .delete();
            await chatDB.streams
              .where(["did", "chatId"])
              .equals([currentDID, id])
              .delete();
          } catch (error) {
            console.error("Failed to delete from DB:", error);
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
              title: "New Chat",
              createdAt: Date.now(),
              updatedAt: Date.now(),
              messages: [],
            };
          }

          // check if there are new messages to add
          const currentMessageIds = new Set(
            session.messages.map((msg) => msg.id)
          );
          const hasNewMessages = messages.some(
            (msg) => !currentMessageIds.has(msg.id)
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

            // async generate title (if new session and has user message)
            if (isNewSession && messages.length > 0) {
              setTimeout(() => {
                get().updateTitle(sessionId);
              }, 0);
            }

            return newState;
          }

          return state;
        });

        get().saveToDB();
      },

      updateSingleMessage: (
        sessionId: string,
        messageId: string,
        updates: Partial<Message>
      ) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          const updatedMessages = session.messages.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          );

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                messages: updatedMessages,
                updatedAt: Date.now(),
              },
            },
          };
        });

        get().saveToDB();
      },

      deleteMessage: (sessionId: string, messageId: string) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          const updatedMessages = session.messages.filter(
            (msg) => msg.id !== messageId
          );

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                messages: updatedMessages,
                updatedAt: Date.now(),
              },
            },
          };
        });

        get().saveToDB();
      },

      deleteMessagesAfterTimestamp: (sessionId: string, timestamp: number) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          const updatedMessages = session.messages.filter((msg) => {
            const messageTime = msg.createdAt
              ? new Date(msg.createdAt).getTime()
              : 0;
            return messageTime < timestamp;
          });

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                messages: updatedMessages,
                updatedAt: Date.now(),
              },
            },
          };
        });

        get().saveToDB();
      },

      getMessages: (sessionId: string) => {
        const { sessions } = get();
        return sessions[sessionId]?.messages || [];
      },

      createStreamId: async (streamId: string, chatId: string) => {
        try {
          await chatDB.streams.add({
            id: streamId,
            chatId,
            createdAt: Date.now(),
          });
        } catch (error) {
          console.error("Failed to create stream ID:", error);
          throw error;
        }
      },

      getStreamIdsByChatId: async (chatId: string) => {
        try {
          const currentDID = await getCurrentDID();
          if (!currentDID) return [];

          const streams = await chatDB.streams
            .where(["did", "chatId"])
            .equals([currentDID, chatId])
            .toArray();
          // sort by creation time
          const sortedStreams = streams.sort(
            (a: StreamRecord, b: StreamRecord) => a.createdAt - b.createdAt
          );
          return sortedStreams.map((stream: StreamRecord) => stream.id);
        } catch (error) {
          console.error("Failed to get stream IDs:", error);
          return [];
        }
      },

      updateTitle: async (sessionId: string) => {
        const session = get().getSession(sessionId);
        if (!session || session.messages.length === 0) return;

        // find the first user message
        const firstUserMessage = session.messages.find(
          (msg) => msg.role === "user"
        );
        if (!firstUserMessage) return;

        try {
          const title = await generateTitleFromUserMessage({
            message: firstUserMessage,
          });

          // directly update session title
          get().updateSession(sessionId, { title });
        } catch (error) {
          console.error("Failed to generate title with AI:", error);
        }
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
            console.error("Failed to clear DB:", error);
          }
        };
        clearDB();
      },

      loadFromDB: async () => {
        if (typeof window === "undefined") return;

        try {
          const currentDID = await getCurrentDID();
          if (!currentDID) return;

          const chats = await chatDB.chats
            .where("did")
            .equals(currentDID)
            .toArray();

          // Sort by updatedAt in descending order
          const sortedChats = chats.sort(
            (a: ChatSession, b: ChatSession) => b.updatedAt - a.updatedAt
          );
          const sessionsMap: Record<string, ChatSession> = {};

          sortedChats.forEach((chat: ChatSession) => {
            sessionsMap[chat.id] = chat;
          });

          set((state) => ({
            sessions: { ...state.sessions, ...sessionsMap },
          }));
        } catch (error) {
          console.error("Failed to load from DB:", error);
        }
      },

      saveToDB: async () => {
        if (typeof window === "undefined") return;

        try {
          const { sessions } = get();
          const chatsToSave = Object.values(sessions);

          // use bulkPut to efficiently update data
          await chatDB.chats.bulkPut(chatsToSave);
        } catch (error) {
          console.error("Failed to save to DB:", error);
        }
      },
    }),
    persistConfig
  )
);
