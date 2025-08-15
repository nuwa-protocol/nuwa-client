import { useCallback, useEffect, useState } from 'react';
import { ChatStateStore } from '@/features/chat/stores';
import { getHttpClient } from '@/shared/services/payment-clients';
import type { ChatRecord, PaymentTransaction } from '../types';

export const useChatTransactionInfo = () => {
  const [chatRecords, setChatRecords] = useState<ChatRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { getChatSessionsSortedByUpdatedAt } = ChatStateStore.getState();

  const fetchChatRecords = useCallback(async () => {
    try {
      const chatSessions = getChatSessionsSortedByUpdatedAt();
      const client = await getHttpClient();
      const txStore = client.getTransactionStore();

      const _chatRecords: ChatRecord[] = [];

      // loop through all chat sessions
      for (const session of chatSessions) {
        const _chatRecord: ChatRecord = {
          chatId: session.id,
          chatTitle: session.title,
          transactions: [],
        };
        // loop through all payment ctx ids in each chat session
        const transactionPromises: Promise<PaymentTransaction>[] =
          session.payments.map(async (payment) => {
            const res = await txStore.get(payment.ctxId);
            if (res) {
              return {
                ctxId: payment.ctxId,
                details: res,
                info: payment,
              };
            } else {
              return {
                ctxId: payment.ctxId,
                details: null,
                info: payment,
              };
            }
          });

        const transactions = await Promise.all(transactionPromises);
        _chatRecord.transactions.push(...transactions);
        _chatRecords.push(_chatRecord);
      }

      setChatRecords(_chatRecords);

      return;
    } catch (error) {
      setError(error as string);
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchChatRecords();
  }, [fetchChatRecords]);

  return {
    chatRecords,
    error,
  };
};
