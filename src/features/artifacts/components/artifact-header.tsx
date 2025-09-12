import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Title } from '@/shared/components/title';
import { Button } from '@/shared/components/ui/button';
import { useChatContext } from '../../chat/contexts/chat-context';

export const ArtifactHeader = ({ title }: { title: string }) => {
    const navigate = useNavigate();
    const { chat } = useChatContext();

    const handleClose = () => {
        navigate(`/chat?cid=${chat.id}`);
    };

    return (
        <div className="sticky top-0 z-10 grid grid-cols-3 items-center border-b border-border bg-background/60 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Left: Actions */}
            <div className="flex items-center gap-1.5">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-md hover:bg-destructive/10"
                    onClick={handleClose}
                    aria-label="Close"
                    title="Close"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
            {/* Center: Title (editable) */}
            <div className="justify-self-center min-w-0 max-w-[min(70vw,700px)]">
                <Title title={title} onCommit={() => { }} />
            </div>
            {/* Right: Placeholder to balance center */}
            <div className="justify-self-end"></div>
        </div>
    );
};
