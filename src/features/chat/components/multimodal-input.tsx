import { type UseChatHelpers, useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import cx from 'classnames';
import { ArrowUpIcon, StopCircleIcon, TextSelect, X } from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useWindowSize } from 'usehooks-ts';
import { CapSelector } from '@/features/cap-store/components';
import { Badge } from '@/shared/components';
import { Button } from '@/shared/components/ui/button';
import { CurrentCapStore } from '@/shared/stores/current-cap-store';
import type { Cap } from '@/shared/types';
import { useChatContext } from '../contexts/chat-context';
import { usePersistentInput } from '../hooks/use-persistent-input';
import { ChatSessionsStore } from '../stores';
import { type AttachmentData, AttachmentInput } from './attachment-input';
import { PreviewAttachment } from './preview-attachment';
import { SuggestedActions } from './suggested-actions';

function PureMultimodalInput({ className }: { className?: string }) {
  const { chat } = useChatContext();
  const { messages, status, stop, setMessages, sendMessage } = useChat({
    chat,
  });
  const { input, setInput, textareaRef, clearInput } = usePersistentInput();
  const { width } = useWindowSize();
  const { currentCap, isInitialized, isError } = CurrentCapStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [attachments, setAttachments] = useState<AttachmentData[]>([]);
  const { chatSessions, removeSelectionFromChatSession } = ChatSessionsStore();
  const selections = chatSessions[chat.id]?.selections;
  const [searchParams, setSearchParams] = useSearchParams();

  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Auto focus when chat ID changes (page navigation)
  useEffect(() => {
    if (textareaRef.current && width && width > 768) {
      textareaRef.current.focus();
    }
  }, [chat.id, width]);

  const handleSend = async () => {
    if (status === 'streaming' || status === 'submitted') {
      toast.warning(
        'Waiting for the model to finish processing the previous message...',
      );
      return;
    }

    // Check if Cap has MCP servers and if they are initialized
    const hasMCPServers =
      currentCap?.core?.mcpServers &&
      Object.keys(currentCap.core.mcpServers).length > 0;

    if (hasMCPServers && !isInitialized) {
      toast.warning('Cap MCP is initializing, please try again later');
      return;
    }

    // TODO: how to send the selections?
    if (input.trim() || attachments.length > 0) {
      sendMessage({
        text: input,
        files: attachments.length > 0 ? attachments : undefined,
      });

      clearInput();
      setAttachments([]);

      const currentUrlCid = searchParams.get('cid');
      if (currentUrlCid !== chat.id) {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('cid', chat.id);
        setSearchParams(newSearchParams);
      }
    }

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  };

  return (
    <div className="relative w-full flex flex-col gap-4">
      {messages.length === 0 && <SuggestedActions />}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2">
          {attachments.map((attachment, index) => (
            <PreviewAttachment
              key={`${attachment.filename || 'file'}-${index}`}
              attachment={{
                name: attachment.filename || 'Unknown file',
                url: attachment.url,
                contentType: attachment.mediaType,
              }}
              onRemove={() => removeAttachment(index)}
            />
          ))}
        </div>
      )}

      <div
        className={cx(
          'flex flex-col rounded-2xl bg-muted dark:border-zinc-700 border border-input ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          className,
        )}
      >
        {/* Selections */}
        {selections && selections.length > 0 && (
          <div className="flex flex-row gap-2 p-2 mx-2">
            {selections?.map((selection) => (
              <Badge
                key={selection.label}
                variant="default"
                className="group cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200 flex items-center gap-1"
                onClick={() => removeSelectionFromChatSession(chat.id, selection)}
              >
                <TextSelect size={12} className="group-hover:hidden" />
                <X size={12} className="hidden group-hover:block" />
                {selection.label}
              </Badge>
            ))}
          </div>
        )}

        {/*  Input Textarea */}
        <textarea
          data-testid="multimodal-input"
          ref={textareaRef}
          placeholder="Send a message..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="flex-1 min-h-[50px] max-h-[calc(25dvh-48px)] overflow-auto hide-scrollbar resize-none text-base bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none pt-3 px-3 pb-0"
          rows={2}
          autoFocus
          style={
            {
              fieldSizing: 'content',
            } as React.CSSProperties
          }
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();

              if (status !== 'ready') {
                console.warn(
                  'The model is not ready to respond. Currnet status:',
                  status,
                );
              }

              handleSend();
            }
          }}
        />

        {/* Cap Selector and Send Button */}
        <div className="flex justify-between items-center p-2">
          <div className="flex items-center gap-2">
            <CapSelector />
          </div>

          <div className="flex items-center gap-2">
            <AttachmentInput
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />

            {status === 'submitted' || status === 'streaming' ? (
              <StopButton
                stop={stop}
                setMessages={setMessages}
                chatId={chat.id}
              />
            ) : (
              <SendButton
                input={input}
                attachments={attachments}
                submitForm={handleSend}
                currentCap={currentCap}
                isCurrentCapMCPInitialized={isInitialized}
                isCurrentCapMCPError={isError}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const MultimodalInput = PureMultimodalInput;

function PureStopButton({
  stop,
  setMessages,
  chatId,
}: {
  stop: () => void;
  setMessages: UseChatHelpers<UIMessage>['setMessages'];
  chatId: string;
}) {
  const { updateMessages } = ChatSessionsStore();
  return (
    <Button
      data-testid="stop-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => {
          updateMessages(chatId, messages);
          return messages;
        });
      }}
    >
      <StopCircleIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  attachments,
  currentCap,
  isCurrentCapMCPInitialized,
  isCurrentCapMCPError,
}: {
  submitForm: () => void;
  input: string;
  attachments: AttachmentData[];
  currentCap: Cap;
  isCurrentCapMCPInitialized: boolean;
  isCurrentCapMCPError: boolean;
}) {
  // Check if Cap has MCP servers
  const hasMCPServers =
    currentCap?.core?.mcpServers &&
    Object.keys(currentCap.core.mcpServers).length > 0;

  const hasContent = input.trim().length > 0 || attachments.length > 0;

  return (
    <Button
      data-testid="send-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={
        !hasContent ||
        (hasMCPServers && (!isCurrentCapMCPInitialized || isCurrentCapMCPError))
      }
    >
      <ArrowUpIcon size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.input !== nextProps.input) return false;
  if (prevProps.attachments.length !== nextProps.attachments.length)
    return false;
  return true;
});
