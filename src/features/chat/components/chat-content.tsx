import { CurrentCapStore } from '@/shared/stores/current-cap-store';
import { useChatContext } from '../contexts/chat-context';
import { ChatSessionsStore } from '../stores/chat-sessions-store';
import { CurrentCapInfo } from './current-cap-info';
import Header from './header';
import { Messages } from './messages';
import { MultimodalInput } from './multimodal-input';

export function ChatContent({
  isReadonly,
  showArtifact,
  setShowArtifact,
}: {
  isReadonly: boolean;
  showArtifact: boolean;
  setShowArtifact: (showArtifact: boolean) => void;
}) {
  const { chat } = useChatContext();
  const { currentCap } = CurrentCapStore();
  const { chatSessions } = ChatSessionsStore();
  const isNewChat = !(chatSessions[chat.id]?.messages.length > 0);

  return (
    <div className="flex flex-col h-full">
      <Header
        chatId={chat.id}
        showArtifact={showArtifact}
        setShowArtifact={setShowArtifact}
      />
      {isNewChat ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <CurrentCapInfo />
        </div>
      ) : (
        <Messages isReadonly={isReadonly} />
      )}
      <div
        className={
          'flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full max-w-4xl'
        }
      >
        {!isReadonly && currentCap && <MultimodalInput />}
      </div>
    </div>
  );
}
