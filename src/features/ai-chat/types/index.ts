import type { Message } from 'ai';

// client chat interface
export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  capId?: string;
  capVersion?: string;
}

// stream ID management interface
export interface StreamRecord {
  id: string;
  chatId: string;
  createdAt: number;
}
