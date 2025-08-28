import { motion } from 'framer-motion';
import { memo } from 'react';
import { useMessagesUI } from '@/features/chat/hooks/use-messages-ui';
import { useChatContext } from '../contexts/chat-context';
import { PreviewMessage, ThinkingMessage } from './message';

interface MessagesProps {
  isReadonly: boolean;
}

function PureMessages({ isReadonly }: MessagesProps) {
  const { chatId, status, messages, setMessages, reload } = useChatContext();
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  } = useMessagesUI({
    chatId,
    status,
  });

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 h-full overflow-y-scroll pt-4 relative"
    >
      {messages.map((message, index) => {
        const isStreaming =
          status === 'streaming' && messages.length - 1 === index;
        const isStreamingReasoning =
          isStreaming &&
          message.role === 'assistant' &&
          message.parts?.some((part) => part.type === 'reasoning') &&
          !message.parts?.some((part) => part.type === 'text');
        return (
          <PreviewMessage
            key={message.id}
            chatId={chatId}
            message={message}
            isStreaming={isStreaming}
            isStreamingReasoning={isStreamingReasoning}
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
            requiresScrollPadding={
              hasSentMessage && index === messages.length - 1
            }
          />
        );
      })}

      {status === 'submitted' &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

      <motion.div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isReadonly !== nextProps.isReadonly) return false;
  return true;
});
