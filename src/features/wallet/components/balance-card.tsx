import { CircleDollarSign, WalletIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { useDevMode } from '@/shared/hooks/use-dev-mode';
import { usePaymentHubRgas } from '@/shared/hooks/use-payment-hub';
import { TestnetFaucetDialog } from './testnet-faucet-dialog';

interface BalanceCardProps {
  onTopUp: () => void;
}

export function BalanceCard({ onTopUp }: BalanceCardProps) {
  const { amount, usd } = usePaymentHubRgas();
  const isDevMode = useDevMode();
  const [showFaucetDialog, setShowFaucetDialog] = useState(false);

  const rgasValue = amount;
  const usdValue = usd;

  return (
    <>
      <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-background via-background to-muted/20">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-theme-primary/5 via-transparent to-theme-primary/5" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-theme-primary/10 rounded-full -translate-y-16 translate-x-16 blur-2xl" />

        <CardHeader className="relative pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-theme-primary/10 border border-theme-primary/20">
                <WalletIcon className="w-5 h-5 text-theme-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Balance</CardTitle>
                <p className="text-sm text-muted-foreground">Testnet</p>
              </div>
            </div>
            <div className="flex items-center">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowFaucetDialog(true)}
              >
                <CircleDollarSign className="w-3.5 h-3.5" />
                Get More Balance
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative">
          <div>
            {/* Main balance display */}
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  ${usdValue}
                </div>
                <div className="text-lg font-medium text-muted-foreground">
                  USD
                </div>
              </div>
              {/* <div className="text-sm text-muted-foreground">{rgasValue} RGas</div> */}
              {/* 
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="p-1.5 rounded-md bg-theme-primary/10">
                  <CoinsIcon className="w-4 h-4 text-theme-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {nuwaValue}{' '}
                    <span className="text-theme-primary font-semibold">
                      $NUWA
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    当前汇率: 1 NUWA = ${(1 / nuwaToUsdRate).toFixed(6)} USD
                  </div>
                </div>
              </div> */}
            </div>

            {/* Quick actions (if in dev mode) */}
            {/* {isDevMode && (
              <div className="flex gap-2 pt-2 border-t border-border/50">
                <button
                  type="button"
                  onClick={onTopUp}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-theme-primary hover:bg-theme-primary/90 rounded-lg transition-colors duration-200"
                >
                  购买积分
                </button>
                <button
                  type="button"
                  onClick={() => console.log('Transfer clicked')}
                  className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors duration-200"
                >
                  转账
                </button>
                <button
                  type="button"
                  onClick={() => console.log('Withdraw clicked')}
                  className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors duration-200"
                >
                  提现
                </button>
              </div>
            )} */}
          </div>
        </CardContent>
      </Card>

      <TestnetFaucetDialog
        open={showFaucetDialog}
        onOpenChange={setShowFaucetDialog}
      />
    </>
  );
}
