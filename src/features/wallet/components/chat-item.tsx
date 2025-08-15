import { formatAmount } from '@nuwa-ai/payment-kit';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible';
import type { ChatRecord, PaymentTransaction } from '../types';
import { TransactionItem } from './transaction-item';

const formatCost = (cost: bigint | undefined) => {
  if (!cost) return undefined;
  if (typeof cost === 'bigint') return `$${formatAmount(cost, 12)}`;
  if (cost !== undefined && cost !== null) {
    return `$${formatAmount(BigInt(String(cost)), 12)}`;
  }
  return undefined;
};

const getTotalCost = (transactions: PaymentTransaction[]) => {
  const total = transactions.reduce((sum, tx) => sum + (tx.details?.payment?.costUsd || 0n), 0n);
  return formatCost(total);
};


interface ChatHistoryItemProps {
  chatRecord: ChatRecord;
  isOpen: boolean;
  onToggle: (chatId: string) => void;
  onSelectTransaction: (transaction: PaymentTransaction) => void;
}

export function ChatItem({
  chatRecord,
  isOpen,
  onToggle,
  onSelectTransaction,
}: ChatHistoryItemProps) {
  if (!chatRecord.chatId || chatRecord.transactions.length === 0) return null;

  const chatId = chatRecord.chatId;
  const totalCost = getTotalCost(chatRecord.transactions);
  return (
    <Collapsible open={isOpen} onOpenChange={() => onToggle(chatId)}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-4 h-auto hover:bg-muted/50"
        >
          <div className="text-left">
            <p className="font-medium truncate max-w-[200px]">
              {chatRecord.chatTitle || 'Untitled Chat'}
            </p>
            <p className="text-sm text-muted-foreground">
              {chatRecord.transactions.length} transaction
              {chatRecord.transactions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="flex items-center space-x-1 text-sm font-medium">
                <span>{totalCost || '$0.00'}</span>
              </div>
            </div>
            {isOpen ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-7 pr-4 pb-2">
        <div className="space-y-2 border-l border-muted-foreground/50 pl-4">
          {chatRecord.transactions.map((transaction) => (
            <TransactionItem
              key={transaction.ctxId}
              transaction={transaction}
              onSelect={onSelectTransaction}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
