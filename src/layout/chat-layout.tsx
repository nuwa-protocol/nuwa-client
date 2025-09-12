import { ChatProvider } from '@/features/chat/contexts/chat-context';
import { Outlet } from 'react-router-dom';

export default function ChatLayout() {
  return (
    <ChatProvider>
      <Outlet />
    </ChatProvider>
  );
}
