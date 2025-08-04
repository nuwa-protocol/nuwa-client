import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { useNavigate } from 'react-router-dom';
import { generateUUID } from '@/shared/utils';
import { ChatSDKError } from '../errors/chatsdk-errors';
import { ErrorHandlers } from '../errors/error-handler';
import { createClientAIFetch } from '../services';
import { useUpdateChatTitle } from './use-update-chat-title';

export const useChatDefault = (
  chatId: string,
  initialMessages: UIMessage[],
) => {
  const navigate = useNavigate();
  const { updateTitle } = useUpdateChatTitle(chatId);

  const handleUseChatError = (error: Error) => {
    console.error('Chat error:', error);
    
    let errorMessage: UIMessage;
    
    if (error instanceof ChatSDKError) {
      errorMessage = ErrorHandlers.api(error.message);
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = ErrorHandlers.network(
        'Failed to connect to the AI service',
      );
    } else if (error.message.includes('timeout')) {
      errorMessage = ErrorHandlers.timeout('AI response');
    } else if (error.message.includes('Please select a Cap')) {
      errorMessage = ErrorHandlers.validation(
        'Please select a Cap before sending messages. Click the "Select Cap" button to choose an AI assistant.',
      );
    } else if (error.message.includes('Authentication failed')) {
      errorMessage = ErrorHandlers.permission(
        'Authentication failed. Please check your login status and try again.',
      );
    } else if (error.message.includes('Network connection failed')) {
      errorMessage = ErrorHandlers.network(
        'Network connection failed. Please check your internet connection and try again.',
      );
    } else if (error.message.includes('Request timeout')) {
      errorMessage = ErrorHandlers.timeout(
        'Request timeout. The AI service is taking too long to respond. Please try again.',
      );
    } else {
      errorMessage = ErrorHandlers.generic(error.message);
    }
    
    // Add error message to chat
    setChatMessages((messages) => [...messages, errorMessage]);
  };

  const handleOnResponse = () => {
    updateTitle();
    navigate(`/chat?cid=${chatId}`);
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
