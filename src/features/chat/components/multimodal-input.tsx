import type { UseChatHelpers } from '@ai-sdk/react';
import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import cx from 'classnames';
import { ArrowUpIcon, PaperclipIcon, StopCircleIcon } from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useWindowSize } from 'usehooks-ts';
import { CapSelector } from '@/features/cap-store/components';
import { Button } from '@/shared/components/ui/button';
import { useCurrentCap } from '@/shared/hooks/use-current-cap';
import type { Cap } from '@/shared/types';
import { useChatContext } from '../contexts/chat-context';
import { useMessageQueue } from '../hooks/use-message-queue';
import { usePersistentInput } from '../hooks/use-persistent-input';
import { useUpdateMessages } from '../hooks/use-update-messages';
import { PreviewAttachment } from './preview-attachment';
import { QueuedMessageBubble } from './queued-message-bubble';
import { SuggestedActions } from './suggested-actions';

function PureMultimodalInput({ className }: { className?: string }) {
  const { chat } = useChatContext();
  const fileInputId = useId();
  const { messages, status, stop, setMessages, sendMessage } = useChat({
    chat,
  });
  const { input, setInput, textareaRef, clearInput } = usePersistentInput();
  const {
    queue,
    addToQueue,
    removeFromQueue,
    dequeueMessage,
    clearQueue,
    hasQueue,
  } = useMessageQueue(chat.id);
  const processingQueueRef = useRef(false);
  const { width } = useWindowSize();
  const { currentCap, isCurrentCapMCPInitialized, isCurrentCapMCPError } =
    useCurrentCap();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showAttachments, setShowAttachments] = useState(false);
  // File attachment state with base64 encoding support
  const [attachments, setAttachments] = useState<
    {
      type: 'file';
      mediaType: string;
      filename?: string;
      url: string;
    }[]
  >([]);

  // File constraints
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ACCEPTED_FILE_TYPES = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',

    // Documents
    'application/pdf',

    // Text files
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/json',
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',

    // Code files
    'text/typescript',
    'text/x-python',
    'text/x-java',
    'text/x-c',
    'text/x-cpp',
  ];

  // Auto focus when chat ID changes (page navigation)
  useEffect(() => {
    if (textareaRef.current && width && width > 768) {
      textareaRef.current.focus();
    }
  }, [chat.id, width]);

  // Convert file to base64 data URL
  const convertFileToDataURL = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate files
    Array.from(files).forEach((file) => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
        return;
      }

      // Check file type
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        errors.push(`${file.name} has unsupported file type: ${file.type}`);
        return;
      }

      validFiles.push(file);
    });

    // Show validation errors
    if (errors.length > 0) {
      toast.error(errors.join(', '));
    }

    // Convert valid files to attachments
    try {
      const newAttachments = await Promise.all(
        validFiles.map(async (file) => ({
          type: 'file' as const,
          filename: file.name,
          mediaType: file.type,
          url: await convertFileToDataURL(file)
        }))
      );

      setAttachments(prev => [...prev, ...newAttachments]);
      setShowAttachments(true);
    } catch (error) {
      console.error('Error converting files:', error);
      toast.error('Failed to process files');
    }
  }, [MAX_FILE_SIZE, ACCEPTED_FILE_TYPES, convertFileToDataURL]);

  // Remove attachment
  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    if (attachments.length === 1) {
      setShowAttachments(false);
    }
  }, [attachments.length]);

  // Auto-send queued messages when AI becomes ready (with delay to prevent errors)
  useEffect(() => {
    if (status === 'ready' && hasQueue && !processingQueueRef.current) {
      // Add a small delay to ensure the AI is fully ready
      processingQueueRef.current = true;
      const timeoutId = setTimeout(() => {
        const nextMessage = dequeueMessage();
        if (nextMessage) {
          // Send the next queued message
          sendMessage({
            text: nextMessage.text,
            files: nextMessage.files,
          });

          if (pathname !== `/chat?cid=${chat.id}`) {
            navigate(`/chat?cid=${chat.id}`, { replace: true });
          }
        }
        processingQueueRef.current = false;
      }, 1000); // 1000ms delay

      return () => {
        clearTimeout(timeoutId);
        processingQueueRef.current = false;
      };
    }
  }, [status, hasQueue, pathname, chat.id]);

  const handleSend = async () => {
    // Check if Cap has MCP servers and if they are initialized
    const hasMCPServers =
      currentCap?.core?.mcpServers &&
      Object.keys(currentCap.core.mcpServers).length > 0;

    if (hasMCPServers && !isCurrentCapMCPInitialized) {
      toast.warning('Cap MCP is initializing, please try again later');
      return;
    }

    if (input.trim() || attachments.length > 0) {
      // If AI is busy (streaming) OR processing queue, add to queue instead of sending immediately
      if (status === 'submitted' || status === 'streaming' || processingQueueRef.current) {
        addToQueue({
          text: input,
          files: attachments.length > 0 ? [...attachments] : undefined,
        });

        clearInput();
        setAttachments([]);
        setShowAttachments(false);

        toast.info('Message added to queue. It will be sent when AI finishes responding.');
        return;
      }

      // Send message immediately if AI is ready
      sendMessage({
        text: input,
        files: attachments.length > 0 ? attachments : undefined,
      });

      clearInput();
      setAttachments([]);
      setShowAttachments(false);

      if (pathname !== `/chat?cid=${chat.id}`) {
        navigate(`/chat?cid=${chat.id}`, { replace: true });
      }
    }

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }

  return (
    <div className="relative w-full flex flex-col gap-4">
      {messages.length === 0 && <SuggestedActions />}

      {/* Queued Messages Bubble */}
      {hasQueue && (
        <div className="flex flex-row items-end justify-end">
          <QueuedMessageBubble
            queue={queue}
            onRemoveMessage={removeFromQueue}
            onClearQueue={clearQueue}
          />
        </div>
      )}

      {showAttachments && attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2">
          {attachments.map((attachment, index) => (
            <PreviewAttachment
              key={`${attachment.filename || 'file'}-${index}`}
              attachment={{
                name: attachment.filename || 'Unknown file',
                url: attachment.url,
                contentType: attachment.mediaType
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

              handleSend();
            }
          }}
        />

        <div className="flex justify-between items-center p-2">
          <div className="flex items-center gap-2">
            <CapSelector />
          </div>

          <div className="flex items-center gap-2">
            {/* File Input */}
            <input
              type="file"
              id={fileInputId}
              multiple
              accept={ACCEPTED_FILE_TYPES.join(',')}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              data-testid="file-input"
            />
            {/* Attachment Toggle Button */}
            <Button
              type="button"
              onClick={() => {
                const fileInput = document.getElementById(fileInputId) as HTMLInputElement;
                fileInput?.click();
              }}
              variant="ghost"
              size="sm"
              className={`p-1.5 h-fit rounded-md hover:bg-accent ${attachments.length > 0 ? 'bg-accent text-primary' : ''}`}
              data-testid="attachment-toggle"
            >
              <PaperclipIcon size={14} />
            </Button>

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
                isCurrentCapMCPInitialized={isCurrentCapMCPInitialized}
                isCurrentCapMCPError={isCurrentCapMCPError}
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
  const updateMessages = useUpdateMessages();
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
  attachments: {
    type: 'file';
    mediaType: string;
    filename?: string;
    url: string;
  }[];
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
