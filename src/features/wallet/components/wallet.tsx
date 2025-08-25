import { useState } from 'react';
import { BalanceCard } from './balance-card';
import { TransactionHistory } from './transaction-history';

export function Wallet() {
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  return (
    <div className="container mx-auto max-w-2xl p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Wallet</h1>
        <p className="text-muted-foreground">
          Manage your credits and view transaction history
        </p>
      </div>

      <BalanceCard onTopUp={() => setShowTopUpModal(true)} />

      <TransactionHistory />

      {/* <AppkitContextProvider>
        <TopUpModal open={showTopUpModal} onOpenChange={setShowTopUpModal} />
      </AppkitContextProvider> */}
    </div>
  );
}
