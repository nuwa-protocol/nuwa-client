import { EditIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/shared/components/ui';
import { useLanguage } from '@/shared/hooks';
import { useChatSessions } from '../hooks/use-chat-sessions';
import { RenameDialog } from './rename-dialog';

interface HeaderProps {
  chatId: string;
}

export default function Header({ chatId }: HeaderProps) {
  const { sessionsMap, updateSession } = useChatSessions();
  const session = sessionsMap[chatId || ''] || null;
  const { t } = useLanguage();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const title = session?.title || '';

  const handleRename = async (newTitle: string) => {
    if (chatId) {
      await updateSession(chatId, { title: newTitle });
    }
  };

  const handleRenameClick = () => {
    setRenameDialogOpen(true);
  };

  return (
    <>
      <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 justify-between">
        <button
          type="button"
          className="text-muted-foreground p-2 flex items-center gap-2 group cursor-pointer bg-transparent border-none hover:bg-sidebar-accent/50 rounded transition-colors"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleRenameClick}
          aria-label={`${t('actions.rename')}: ${title}`}
        >
          <span>{title}</span>
          {isHovered && title && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleRenameClick();
              }}
              aria-label={t('actions.rename')}
            >
              <EditIcon className="h-3 w-3" />
            </Button>
          )}
        </button>
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
