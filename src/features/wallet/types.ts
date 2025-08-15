import type { TransactionRecord } from '@nuwa-ai/payment-kit';
import type { ChatPayment } from '@/features/chat/types';

export type Network = 'ethereum' | 'arbitrum' | 'base' | 'polygon' | 'bsc';

export type Asset = 'usdt' | 'usdc';

type TransactionStatus = 'confirming' | 'completed';

export interface PaymentTransaction {
  ctxId: string;
  details: TransactionRecord | null;
  info: ChatPayment;
}

export interface ChatRecord {
  chatId: string;
  chatTitle: string;
  transactions: PaymentTransaction[];
}

export interface DepositTransaction {
  id: string;
  type: 'deposit';
  label: string;
  timestamp: number;
  amount: number;
  status: TransactionStatus;
}

export interface SpendTransaction {
  id: string;
  type: 'spend';
  label: string;
  timestamp: number;
  amount: number;
  chatid: string;
  capid: string;
  status: TransactionStatus;
}

export type Transaction = DepositTransaction | SpendTransaction;
