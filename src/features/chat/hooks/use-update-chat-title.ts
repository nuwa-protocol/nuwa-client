import { useCallback } from 'react';
import { generateTitleFromUserMessage } from '../services';
import { ChatStateStore } from '../stores';

export const useUpdateChatTitle = (chatId: string) => {
  const store = ChatStateStore();

  const updateTitle = useCallback(async () => {
    const session = store.getChatSession(chatId);
    if (!session) return;

    const firstMessage = session.messages[0];

    if (!firstMessage) return;
    if (session.title !== 'New Chat') return;

    const title = await generateTitleFromUserMessage({
      chatId: chatId,
      message: firstMessage,
    });

    await store.updateSession(chatId, { title: title });
  }, [chatId]);

  return {
    updateTitle,
  };
};
