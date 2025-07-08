import { useCallback } from 'react';
import { ChatStateStore } from '@/features/ai-chat/stores/chat-store';
import type { ChatSession } from '@/features/ai-chat/types';

export const useChatSessions = () => {
  const store = ChatStateStore();

  const createSession = useCallback((session?: Partial<ChatSession>) => {
    return store.createSession(session);
  }, []);

  const deleteSession = useCallback((id: string) => {
    store.deleteSession(id);
  }, []);

  const updateSession = useCallback(
    (id: string, updates: Partial<Omit<ChatSession, 'id'>>) => {
      store.updateSession(id, updates);
    },
    [],
  );

  const clearAllSessions = useCallback(() => {
    store.clearAllSessions();
  }, []);

  const getSortedSessions = useCallback(() => {
    return Object.values(store.sessions).sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
  }, [store.sessions]);

  return {
    sessions: getSortedSessions(),
    sessionsMap: store.sessions,
    createSession,
    deleteSession,
    updateSession,
    clearAllSessions,
  };
};
