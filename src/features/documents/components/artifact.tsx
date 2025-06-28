'use client';;
import type { Attachment, UIMessage } from 'ai';
import { useState } from 'react';

import { ArtifactViewer } from './artifact-viewer';
import { MultimodalInput } from '@/features/ai-chat/components';
import { Messages } from '@/features/ai-chat/components';
import { ArtifactMessagesHeader } from './artifact-messages-header';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle
} from '@/shared/components/ui/resizable';

import { useCurrentDocument } from '@/features/documents/hooks/use-document-current';
import { useChatDefault } from '@/features/ai-chat/hooks/use-chat-default';
import { useNavigate } from 'react-router-dom';

export function Artifact({
  chatId,
  initialMessages,
  isReadonly,
}: {
  chatId: string;
  initialMessages: Array<UIMessage>;
  isReadonly: boolean;
}) {
  const navigate = useNavigate();

  const handleOnResponse = (response: any) => {
    navigate(`/artifact?cid=${chatId}`);
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
  } = useChatDefault(chatId, initialMessages, handleOnResponse);

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const { currentDocument } = useCurrentDocument();
  const isArtifact = currentDocument.documentId !== 'init';

  if (!isArtifact) {
    return (
      <div className="flex size-full justify-center items-center">
        Todo: this is the all artifact page
      </div>
    );
  }

  return (
    <div className="h-dvh w-dvw fixed top-0 left-0 z-50 bg-transparent">
      <ResizablePanelGroup 
        direction="horizontal" 
        className="h-full w-full"
      >
        {/* Artifact viewer panel */}
        <ResizablePanel 
          defaultSize={60} 
          minSize={30}
          className="min-w-96"
        >
          <ArtifactViewer
            chatId={chatId}
            status={status}
          />
        </ResizablePanel>

        {/* Resizable handle */}
        <ResizableHandle />

        {/* Chat panel */}
        <ResizablePanel 
          defaultSize={40} 
          minSize={25}
          className="min-w-80"
        >
          <div className="flex flex-col bg-muted dark:bg-background h-full">
            <ArtifactMessagesHeader chatId={chatId} />
            <Messages
              chatId={chatId}
              status={status}
              messages={messages}
              setMessages={setChatMessages}
              reload={reload}
              isReadonly={isReadonly}
              isArtifact
            />

            <form
              className={'flex flex-row gap-2 relative items-end w-full px-4 pb-4'}
            >
              {!isReadonly && (
                <MultimodalInput
                  chatId={chatId}
                  input={input}
                  setInput={setInput}
                  handleSubmit={handleSubmit}
                  status={status}
                  stop={stop}
                  attachments={attachments}
                  setAttachments={setAttachments}
                  messages={messages}
                  append={append}
                  className="bg-background dark:bg-muted"
                  setMessages={setChatMessages}
                />
              )}
            </form>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
