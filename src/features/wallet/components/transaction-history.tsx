import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { useChatTransactionInfo } from '../hooks/use-chat-transaction-info';
import type { PaymentTransaction } from '../types';
import { ChatItem } from './chat-item';
import { TransactionDetailsModal } from './transaction-details-modal';

export function TransactionHistory() {
  const { chatRecords, error } = useChatTransactionInfo();
  const [selectedTransaction, setSelectedTransaction] =
    useState<PaymentTransaction | null>(null);
  const [openChats, setOpenChats] = useState<Set<string>>(new Set());

  const toggleChat = (chatId: string) => {
    const newOpenChats = new Set<string>();
    if (!openChats.has(chatId)) {
      newOpenChats.add(chatId);
    }
    setOpenChats(newOpenChats);
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading transactions: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {chatRecords.length === 0 ? (
              <p className="text-muted-foreground">No transactions found</p>
            ) : (
              chatRecords.map((chatRecord) => (
                <ChatItem
                  key={chatRecord.chatId}
                  chatRecord={chatRecord}
                  isOpen={openChats.has(chatRecord.chatId)}
                  onToggle={toggleChat}
                  onSelectTransaction={setSelectedTransaction}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <TransactionDetailsModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </>
  );
}
