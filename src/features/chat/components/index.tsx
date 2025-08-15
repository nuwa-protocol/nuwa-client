import type { Attachment, UIMessage } from 'ai';
import { useState } from 'react';
import { useChatDefault } from '@/features/chat/hooks/use-chat-default';
import { CenteredWelcome } from './centered-welcome';
import Header from './header';
import { Messages } from './messages';
import { MultimodalInput } from './multimodal-input';

export function Chat({
  id,
  initialMessages,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  isReadonly: boolean;
}) {
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
  } = useChatDefault(id, initialMessages);

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  const renderEmptyState = () => (
    <CenteredWelcome>
      <div className="w-full max-w-3xl space-y-6">
        <div className="px-4">
          <MultimodalInput
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            status={status}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            append={append}
            className={undefined}
            setMessages={setChatMessages}
          />
        </div>
      </div>
    </CenteredWelcome>
  );

  return (
    <div className="flex flex-col relative min-w-0 h-dvh bg-background">
      {/* Chat */}
      <div className={'flex flex-col w-full h-dvh bg-background'}>
        <Header chatId={id} />

        {messages.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <Messages
              chatId={id}
              status={status}
              messages={messages}
              setMessages={setChatMessages}
              reload={reload}
              isReadonly={isReadonly}
            />

            <form
              className={
                'flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl'
              }
            >
              {!isReadonly && (
                <MultimodalInput
                  chatId={id}
                  input={input}
                  setInput={setInput}
                  handleSubmit={handleSubmit}
                  status={status}
                  stop={stop}
                  attachments={attachments}
                  setAttachments={setAttachments}
                  messages={messages}
                  append={append}
                  className={undefined}
                  setMessages={setChatMessages}
                />
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
