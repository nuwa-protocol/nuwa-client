import { MessageCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

interface TestnetFaucetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TestnetFaucetDialog({
  open,
  onOpenChange,
}: TestnetFaucetDialogProps) {
  const handleDiscordClick = () => {
    // Open Discord link
    window.open('https://discord.gg/nuwa', '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogDescription className=" text-sm text-muted-foreground">
            Need more testnet balance?
          </DialogDescription>
          <DialogTitle className=" text-lg font-medium text-primary">
            Join Nuwa AI Discord to get free testnet balance
          </DialogTitle>
        </DialogHeader>

        <DialogFooter className="mt-4">
          <Button
            onClick={handleDiscordClick}
            variant="primary"
            className="w-full"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Join Discord
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
