import { useCallback } from 'react';
import { generateTitleFromUserMessage } from '../services';
import { ChatStateStore } from '../stores';
import { getErrorMessage, processErrorMessage } from '../utils';

export const useUpdateChatTitle = (chatId: string) => {
  const store = ChatStateStore();

  const updateTitle = useCallback(async () => {
    const session = store.getChatSession(chatId);
    if (!session) return;

    const firstMessage = session.messages[0];

    if (!firstMessage) return;
    if (session.title !== 'New Chat') return;
    try {
      const title = await generateTitleFromUserMessage({
        chatId: chatId,
        message: firstMessage,
      });

      await store.updateSession(chatId, { title: title });
    } catch (error) {
      processErrorMessage(getErrorMessage(error));
    }
  }, [chatId]);

  return {
    updateTitle,
  };
};
