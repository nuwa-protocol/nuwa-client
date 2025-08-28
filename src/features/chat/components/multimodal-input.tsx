import type { UseChatHelpers } from '@ai-sdk/react';
import type { Attachment } from 'ai';
import cx from 'classnames';
import equal from 'fast-deep-equal';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUpIcon,
  PaperclipIcon,
  StopCircleIcon,
} from 'lucide-react';
import type React from 'react';
import {
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import { CapSelector } from '@/features/cap-store/components';
import { useScrollToBottom } from '@/features/chat/hooks/use-scroll-to-bottom';
import { Button } from '@/shared/components/ui/button';
import { useCurrentCap } from '@/shared/hooks/use-current-cap';
import { useDevMode } from '@/shared/hooks/use-dev-mode';
import type { Cap } from '@/shared/types/cap';
import { useChatContext } from '../contexts/chat-context';
import { useUpdateMessages } from '../hooks/use-update-messages';
import { SuggestedActions } from './suggested-actions';

function PureMultimodalInput({
  attachments,
  setAttachments,
  className,
}: {
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  className?: string;
}) {
  const {
    chatId,
    input,
    setInput,
    status,
    stop,
    messages,
    setMessages,
    append,
    handleSubmit,
  } = useChatContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const isDevMode = useDevMode();
  const { currentCap, isCurrentCapMCPInitialized, isCurrentCapMCPError } =
    useCurrentCap();

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  // Auto focus when chat ID changes (page navigation)
  useEffect(() => {
    if (textareaRef.current && width && width > 768) {
      textareaRef.current.focus();
    }
  }, [chatId, width]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    // Check if Cap has MCP servers and if they are initialized
    const hasMCPServers =
      currentCap?.core?.mcpServers &&
      Object.keys(currentCap.core.mcpServers).length > 0;

    if (hasMCPServers && !isCurrentCapMCPInitialized) {
      toast.warning('Cap MCP is initializing, please try again later');
      return;
    }

    handleSubmit(undefined);

    setLocalStorageInput('');

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    handleSubmit,
    setLocalStorageInput,
    width,
    currentCap,
    isCurrentCapMCPInitialized,
    isCurrentCapMCPError,
  ]);

  const { isAtBottom, scrollToBottom } = useScrollToBottom();

  useEffect(() => {
    if (status === 'submitted') {
      scrollToBottom();
    }
  }, [status, scrollToBottom]);

  return (
    <div className="relative w-full flex flex-col gap-4">
      <AnimatePresence>
        {messages.length > 0 && !isAtBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute left-1/2 bottom-28 -translate-x-1/2 z-50"
          >
            <Button
              data-testid="scroll-to-bottom-button"
              className="rounded-full"
              size="icon"
              variant="outline"
              onClick={(event) => {
                event.preventDefault();
                scrollToBottom();
              }}
            >
              <ArrowDown />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {messages.length === 0 && <SuggestedActions append={append} />}

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
          onChange={handleInput}
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

              submitForm();
            }
          }}
        />

        <div className="flex justify-between items-center p-2">
          <div className="flex items-center gap-2">
            <CapSelector />
          </div>

          <div className="flex items-center">
            {/* {isDevMode && (
              <AttachmentsButton fileInputRef={fileInputRef} status={status} />
            )} */}
            {status === 'submitted' || status === 'streaming' ? (
              <StopButton
                stop={stop}
                setMessages={setMessages}
                chatId={chatId}
              />
            ) : (
              <SendButton
                input={input}
                submitForm={submitForm}
                uploadQueue={uploadQueue}
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

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    return true;
  },
);

function PureAttachmentsButton({
  fileInputRef,
  status,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers['status'];
}) {
  return (
    <Button
      data-testid="attachments-button"
      className="rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      disabled={status !== 'ready'}
      variant="ghost"
    >
      <PaperclipIcon size={14} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
  chatId,
}: {
  stop: () => void;
  setMessages: UseChatHelpers['setMessages'];
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
  uploadQueue,
  currentCap,
  isCurrentCapMCPInitialized,
  isCurrentCapMCPError,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
  currentCap: Cap;
  isCurrentCapMCPInitialized: boolean;
  isCurrentCapMCPError: boolean;
}) {
  // Check if Cap has MCP servers
  const hasMCPServers =
    currentCap?.core?.mcpServers &&
    Object.keys(currentCap.core.mcpServers).length > 0;

  return (
    <Button
      data-testid="send-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={
        input.length === 0 ||
        uploadQueue.length > 0 ||
        (hasMCPServers && (!isCurrentCapMCPInitialized || isCurrentCapMCPError))
      }
    >
      <ArrowUpIcon size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});
