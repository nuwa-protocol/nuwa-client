// use-chat.ts (重构版本)
// Enhanced hooks that use services for business logic
'use client';

import { useCallback } from 'react';
import { ChatStateStore } from '@/features/ai-chat/stores';

export const useChatStreams = () => {
  const store = ChatStateStore();

  const createStreamId = useCallback(
    async (streamId: string, chatId: string) => {
      await store.createStreamId(streamId, chatId);
    },
    [],
  );

  const readStreamIdsByChatId = useCallback(async (chatId: string) => {
    return await store.readStreamIdsByChatId(chatId);
  }, []);

  return {
    createStreamId,
    readStreamIdsByChatId,
  };
};
