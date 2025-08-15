import { formatAmount } from '@nuwa-ai/payment-kit';
import { Button } from '@/shared/components/ui/button';
import type { PaymentTransaction } from '../types';

const formatCost = (cost: bigint | undefined) => {
  if (!cost) return undefined;
  if (typeof cost === 'bigint') return `$${formatAmount(cost, 12)}`;
  if (cost !== undefined && cost !== null) {
    return `$${formatAmount(BigInt(String(cost)), 12)}`;
  }
  return undefined;
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString();
};

const formatTransactionLabel = (transaction: PaymentTransaction) => {
  if (transaction.info.type === 'generate-title') {
    return 'Chat Title Generation';
  }
  return `AI Request - "${transaction.info.message?.slice(0, 15)}${transaction.info.message?.length && transaction.info.message.length > 15 ? '...' : ''}"`;
};

interface TransactionItemProps {
  transaction: PaymentTransaction;
  onSelect: (transaction: PaymentTransaction) => void;
}

export function TransactionItem({
  transaction,
  onSelect,
}: TransactionItemProps) {
  return (
    <Button
      variant="ghost"
      className="w-full justify-between p-2 h-auto hover:bg-muted/30 rounded-sm"
      onClick={() => onSelect(transaction)}
    >
      <div className="text-left">
        <p className="text-sm font-medium">{formatTransactionLabel(transaction)}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(transaction.details?.timestamp || 0)}
        </p>
      </div>
      <div className="text-right">
        {!transaction.details ? <p className="text-sm font-medium">
          No transaction record
        </p> : transaction.details.status === "pending" ? (
          <p className="text-sm font-medium">
            Pending...
          </p>
        ) : (
          <p className="text-sm font-medium">
            {formatCost(transaction.details?.payment?.costUsd) || '$0.00'}
          </p>
        )}
      </div>
    </Button>
  );
}
