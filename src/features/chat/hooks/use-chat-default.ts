import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { generateUUID } from '@/shared/utils';
import { createClientAIFetch } from '../services';
import { processErrorMessage } from '../utils';
import { useChatSessions } from './use-chat-sessions';
import { useUpdateChatTitle } from './use-update-chat-title';

export const useChatDefault = (
  chatId: string,
  initialMessages: UIMessage[],
) => {
  const navigate = useNavigate();
  const { updateTitle } = useUpdateChatTitle(chatId);
  const { addCurrentCapsToChat, getSession } = useChatSessions();

  const handleUseChatError = (error: Error) => {
    const errorMessage = processErrorMessage(error);
    if (errorMessage !== 'IGNORED_ERROR') {
      // Use the actual error message from processErrorMessage
      toast.error('An error occurred', {
        description: errorMessage,
        action: {
          label: 'Retry',
          onClick: () => reload(),
        },
      });
    }
  };

  const handleOnResponse = () => {
    updateTitle();
    addCurrentCapsToChat(chatId);
    const currentChatIdFromParams = new URLSearchParams(
      window.location.search,
    ).get('cid');
    if (currentChatIdFromParams !== chatId) {
      navigate(`/chat?cid=${chatId}`);
    }
  };

  const handleOnFinish = () => {
    const chatSession = getSession(chatId);
    const currentChatIdFromParams = new URLSearchParams(
      window.location.search,
    ).get('cid');
    if (currentChatIdFromParams === chatId) return;
    toast.success(
      `Your chat ${chatSession ? `"${chatSession.title} is"` : 'is'} completed`,
      {
        action: {
          label: 'View Chat',
          onClick: () => navigate(`/chat?cid=${chatId}`),
        },
      },
    );
  };

  const {
    messages,
    setMessages: setChatMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
  } = useChat({
    id: chatId,
    key: `chat-${chatId}`, // Force re-creation when chatId changes
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    fetch: createClientAIFetch(),
    experimental_prepareRequestBody: (body) => ({
      id: chatId,
      messages: body.messages,
    }),
    onError: handleUseChatError,
    onResponse: handleOnResponse,
    onFinish: handleOnFinish,
  });

  return {
    messages,
    setMessages: setChatMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
  };
};
