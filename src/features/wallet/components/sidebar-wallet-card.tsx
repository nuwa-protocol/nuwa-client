import { WalletIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCopyToClipboard } from 'usehooks-ts';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Card, CardContent } from '@/shared/components/ui/card';
import { usePaymentHubRgas } from '@/shared/hooks/use-payment-hub';
import { cn } from '@/shared/utils';

interface SidebarWalletCardProps {
  className?: string;
}

export function SidebarWalletCard({ className }: SidebarWalletCardProps) {
  const navigate = useNavigate();
  const { did, isConnected } = useAuth();
  const { usd, loading, error } = usePaymentHubRgas();
  const [_, copyToClipboard] = useCopyToClipboard();

  const usdValue = loading ? '…' : error ? '-' : usd;

  const handleClick = () => {
    navigate('/wallet');
  };

  const handleCopyDid = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (did) {
      await copyToClipboard(did);
      toast.success('DID copied to clipboard!');
    }
  };

  const formatDid = (did: string) => {
    if (did.length > 16) {
      return `${did.slice(0, 8)}...${did.slice(-8)}`;
    }
    return did;
  };

  if (!isConnected || !did) {
    return null;
  }

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 border-border/50 hover:bg-accent/50 hover:shadow-xl hover:scale-[1.02]',
        'py-2',
        className,
      )}
      onClick={handleClick}
    >
      <CardContent className="px-3 h-6">
        <div className="">
          <div className="flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 p-1 text-muted-foreground">
              <WalletIcon className="size-4" />
              <span className="text-xs font-medium">Wallet</span>
            </div>
            <div className="flex flex-col items-start space-y-1">
              <div className="text-sm font-bold text-foreground">
                ${usdValue} USD
              </div>
            </div>
          </div>

          {/* <div className="flex items-center justify-between pt-1 border-t border-border/30">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground truncate font-mono">
                {formatDid(did)}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-primary/10"
              onClick={handleCopyDid}
            >
              <Copy className="h-2.5 w-2.5" />
            </Button>
          </div> */}
        </div>
      </CardContent>
    </Card>
  );
}
