import type { UseChatHelpers } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import { useChatDefault } from '../hooks/use-chat-default';

interface ChatContextValue {
  // Chat state
  messages: UIMessage[];
  input: UseChatHelpers['input'];
  status: UseChatHelpers['status'];

  // Chat actions
  setMessages: UseChatHelpers['setMessages'];
  setInput: UseChatHelpers['setInput'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  append: UseChatHelpers['append'];
  stop: () => void;
  reload: UseChatHelpers['reload'];

  // Chat metadata
  chatId: string;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

interface ChatProviderProps {
  children: ReactNode;
  chatId: string;
  initialMessages: UIMessage[];
}

export function ChatProvider({
  children,
  chatId,
  initialMessages,
}: ChatProviderProps) {
  const chatState = useChatDefault(chatId, initialMessages);

  const value: ChatContextValue = {
    ...chatState,
    chatId,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
