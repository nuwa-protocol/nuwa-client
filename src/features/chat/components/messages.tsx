import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import { useStickToBottomContext } from 'use-stick-to-bottom';
import { ChatErrorCode, resolveChatErrorCode } from '@/shared/utils/handle-error';
import { useChatContext } from '../contexts/chat-context';
import { useAssistantMinHeight } from '../hooks';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from './conversation';
import { PreviewMessage } from './message';

interface MessagesProps {
  isReadonly: boolean;
}

function PureMessages({ isReadonly }: MessagesProps) {
  const { chat } = useChatContext();
  const { messages, status, setMessages, regenerate, error } = useChat({
    chat,
    experimental_throttle: 120,
  });
  const { scrollToBottom } = useStickToBottomContext();
  const prevLengthRef = useRef<number>(messages.length);

  // Find the last clear context message index
  const lastClearContextIndex = messages.findLastIndex(
    (message) =>
      message.role === 'system' &&
      message.parts?.some(
        (part) => part.type === 'data-uimark' && part.data === 'clear-context',
      ),
  );

  const { lastAssistantId, lastAssistantMinHeight, registerMessageNode } =
    useAssistantMinHeight({ messages });

  // When a user sends a new message, force scroll to bottom immediately
  useEffect(() => {
    const last = messages[messages.length - 1];
    const lengthIncreased = messages.length > prevLengthRef.current;
    if (lengthIncreased && last?.role === 'user') {
      // Jump to bottom so the user instantly sees their message and the reply area
      // Use instant to avoid visible scroll animation on send
      try {
        scrollToBottom({ animation: 'smooth', ignoreEscapes: true });
      } catch {
        // no-op if context not ready
      }
    }
    prevLengthRef.current = messages.length;
  }, [messages, scrollToBottom]);

  const resolvedErrorCode = error ? resolveChatErrorCode(error) : undefined;
  const effectiveError =
    resolvedErrorCode === ChatErrorCode.IGNORED_ERROR ? undefined : error;

  return (
    <ConversationContent>
      {messages.map((message, index) => {
        // Messages before the last clear context should be muted
        const isBeforeLastClearContext =
          lastClearContextIndex !== -1 && index < lastClearContextIndex;

        const isStreaming =
          status === 'streaming' && messages.length - 1 === index;
        const isStreamingReasoning =
          isStreaming &&
          message.role === 'assistant' &&
          message.parts?.some((part) => part.type === 'reasoning') &&
          !message.parts?.some((part) => part.type === 'text');

        const shouldPushToTop =
          message.role === 'assistant' &&
          index === messages.length - 1 &&
          message.id === lastAssistantId;
        const minHeight = shouldPushToTop
          ? lastAssistantMinHeight
          : undefined;

        const isErrorMessage =
          Boolean(effectiveError) &&
          message.role === 'assistant' &&
          index === messages.length - 1 &&
          message.id === lastAssistantId;
        let messageError: Error | undefined;
        if (isErrorMessage && effectiveError) {
          messageError = effectiveError;
        }

        return (
          <div
            key={message.id}
            ref={registerMessageNode(message.id)}
            className={isBeforeLastClearContext ? 'opacity-50' : ''}
          >
            <PreviewMessage
              key={message.id}
              chatId={chat.id}
              message={message}
              isReadonly={isReadonly}
              minHeight={minHeight}
              error={messageError}
              isStreamingReasoning={isStreamingReasoning}
              isStreaming={isStreaming}
              setMessages={setMessages}
              regenerate={regenerate}
            />
          </div>
        );
      })}
    </ConversationContent>
  );
}

export function Messages({ isReadonly }: MessagesProps) {
  return (
    <Conversation>
      <PureMessages isReadonly={isReadonly} />
      <ConversationScrollButton />
    </Conversation>
  );
}
