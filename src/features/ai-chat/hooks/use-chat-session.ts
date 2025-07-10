import type { Message } from 'ai';
import { useCallback } from 'react';
import { type ChatSession, ChatStateStore } from '@/features/ai-chat/stores';

export const useChatSession = (sessionId: string) => {
  const store = ChatStateStore();

  const session = store.readSession(sessionId);

  const updateMessages = useCallback(
    (messages: Message[]) => {
      store.updateMessages(sessionId, messages);
    },
    [sessionId],
  );

  const updateSingleMessage = useCallback(
    (messageId: string, updates: Partial<Message>) => {
      store.updateSingleMessage(sessionId, messageId, updates);
    },
    [sessionId],
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      store.deleteMessage(sessionId, messageId);
    },
    [sessionId],
  );

  const deleteMessagesAfterTimestamp = useCallback(
    (timestamp: number) => {
      store.deleteMessagesAfterTimestamp(sessionId, timestamp);
    },
    [sessionId],
  );

  return {
    session,
    messages: store.readMessages(sessionId),
    updateMessages,
    updateSingleMessage,
    deleteMessage,
    deleteMessagesAfterTimestamp,
  };
};
