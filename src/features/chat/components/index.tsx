import type { Attachment, UIMessage } from 'ai';
import { useState } from 'react';
import { ChatProvider, useChatContext } from '../contexts/chat-context';
import { CenteredWelcome } from './centered-welcome';
import Header from './header';
import { Messages } from './messages';
import { MultimodalInput } from './multimodal-input';

function ChatContent({ isReadonly }: { isReadonly: boolean }) {
  const { messages, chatId } = useChatContext();
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  const renderEmptyState = () => (
    <CenteredWelcome>
      <div className="w-full max-w-3xl space-y-6">
        <div className="px-4">
          <MultimodalInput
            attachments={attachments}
            setAttachments={setAttachments}
            className={undefined}
          />
        </div>
      </div>
    </CenteredWelcome>
  );

  return (
    <div className="flex flex-col relative min-w-0 h-dvh bg-background">
      {/* Chat */}
      <div className={'flex flex-col w-full h-dvh bg-background'}>
        <Header chatId={chatId} />

        {messages.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <Messages isReadonly={isReadonly} />

            <form
              className={
                'flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl'
              }
            >
              {!isReadonly && (
                <MultimodalInput
                  attachments={attachments}
                  setAttachments={setAttachments}
                  className={undefined}
                />
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export function Chat({
  id,
  initialMessages,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  isReadonly: boolean;
}) {
  return (
    <ChatProvider chatId={id} initialMessages={initialMessages}>
      <ChatContent isReadonly={isReadonly} />
    </ChatProvider>
  );
}
