'use client';

import type { Attachment, UIMessage } from 'ai';
import { useState } from 'react';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import Header from '@/layout/components/header';
import { useChatDefault } from '@/features/ai-chat/hooks/use-chat-default';
import { useNavigate } from 'react-router-dom';

export function Chat({
  id,
  initialMessages,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  isReadonly: boolean;
}) {
  const navigate = useNavigate();

  const handleOnResponse = (response: any) => {
    navigate(`/chat?cid=${id}`);
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
  } = useChatDefault(id, initialMessages, handleOnResponse);

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  return (
    <div className="flex flex-col relative min-w-0 h-dvh bg-background">
      {/* Artifact viewer */}

      {/* Chat */}
      <div className={'flex flex-col w-full h-dvh bg-background'}>
        <Header />
        <Messages
          chatId={id}
          status={status}
          messages={messages}
          setMessages={setChatMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifact={false}
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
      </div>
    </div>
  );
}
