import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Title } from '@/shared/components/title';
import { useLanguage } from '@/shared/hooks';
import { ChatSessionsStore } from '../stores';
import { RenameDialog } from './rename-dialog';

interface HeaderProps {
  chatId: string;
}

export default function Header({ chatId }: HeaderProps) {
  const { chatSessions, updateSession } = ChatSessionsStore();
  const session = chatSessions[chatId || ''] || null;
  const { t } = useLanguage();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = useLocation().pathname;
  const isArtifact = pathname.includes('artifacts');

  const title = session?.title || '';

  const handleRename = async (newTitle: string) => {
    if (chatId) {
      await updateSession(chatId, { title: newTitle });
    }
  };

  return (
    <>
      <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 justify-between">
        <Title
          title={title}
          onCommit={handleRename}
          className="text-muted-foreground p-2 flex items-center gap-2 group cursor-pointer bg-transparent border-none hover:bg-sidebar-accent/50 rounded transition-colors"
        />
      </header>

      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        currentName={title}
        onRename={handleRename}
      />
    </>
  );
}
