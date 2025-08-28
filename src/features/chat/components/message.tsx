import type { UseChatHelpers } from '@ai-sdk/react';
import type { UIMessage } from 'ai';

import equal from 'fast-deep-equal';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import { cn } from '@/shared/utils';
import { MessageActions } from './message-actions';
import { MessageReasoning } from './message-reasoning';
import { MessageSource } from './message-source';
import { MessageText } from './message-text';
import { ToolCall } from './tool-call';
import { ToolResult } from './tool-result';

const PurePreviewMessage = ({
  chatId,
  message,
  isStreaming,
  isStreamingReasoning,
  setMessages,
  reload,
  isReadonly,
  requiresScrollPadding,
}: {
  chatId: string;
  message: UIMessage;
  isStreaming: boolean;
  isStreamingReasoning: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-4xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          <div
            className={cn('flex flex-col gap-4 w-full', {
              'min-h-96': message.role === 'assistant' && requiresScrollPadding,
            })}
          >
            {/* render reasoning */}
            {message.parts?.map((part, index) => {
              if (part.type !== 'reasoning') return null;
              return (
                <MessageReasoning
                  key={`reasoning-${message.id}-${index}`}
                  isStreaming={isStreamingReasoning}
                  content={part.reasoning}
                />
              );
            })}

            {/* render text/tool-invocation */}
            {message.parts?.map((part, index) => {
              const processedTypes = new Set(['reasoning', 'source']);
              if (processedTypes.has(part.type)) return null;

              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'text') {
                return (
                  <MessageText
                    key={key}
                    chatId={chatId}
                    message={message}
                    part={part}
                    index={index}
                    isReadonly={isReadonly}
                    setMessages={setMessages}
                    reload={reload}
                    onModeChange={setMode}
                  />
                );
              }

              if (type === 'tool-invocation') {
                const { toolInvocation } = part;
                const { toolName, toolCallId, state } = toolInvocation;

                if (state === 'call') {
                  const { args } = toolInvocation;

                  return (
                    <ToolCall
                      key={toolCallId}
                      toolName={toolName}
                      toolCallId={toolCallId}
                      args={args}
                    />
                  );
                }

                if (state === 'result') {
                  const { result, args } = toolInvocation;

                  // if it is not, render the plain tool result
                  return (
                    <ToolResult
                      key={toolCallId}
                      toolName={toolName}
                      toolCallId={toolCallId}
                      result={result}
                      args={args}
                    />
                  );
                }
              }
            })}

            {/* render source */}
            {(() => {
              const sources: any[] = [];
              message.parts?.forEach((part) => {
                if (part.type === 'source') {
                  sources.push(part.source);
                }
              });
              if (sources.length === 0) return null;
              return (
                <MessageSource
                  key={`sources-${message.id}`}
                  sources={sources}
                  className="mb-2"
                />
              );
            })()}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                message={message}
                isStreaming={isStreaming}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isStreaming !== nextProps.isStreaming) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;

    return true;
  },
);
