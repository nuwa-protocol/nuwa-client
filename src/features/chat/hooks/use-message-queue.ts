import { useCallback, useEffect, useState } from 'react';

export interface QueuedMessage {
  id: string;
  text: string;
  files?: {
    type: 'file';
    mediaType: string;
    filename?: string;
    url: string;
  }[];
  timestamp: number;
}

export function useMessageQueue(chatId: string) {
  const [queue, setQueue] = useState<QueuedMessage[]>([]);

  // Load queue from session storage on mount/chatId change
  useEffect(() => {
    const storageKey = `message_queue_${chatId}`;
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsedQueue = JSON.parse(stored);
        setQueue(parsedQueue);
      } catch (error) {
        console.warn('Failed to parse stored message queue:', error);
        sessionStorage.removeItem(storageKey);
      }
    }
  }, [chatId]);

  // Save queue to session storage whenever it changes
  useEffect(() => {
    const storageKey = `message_queue_${chatId}`;
    if (queue.length > 0) {
      sessionStorage.setItem(storageKey, JSON.stringify(queue));
    } else {
      sessionStorage.removeItem(storageKey);
    }
  }, [queue, chatId]);

  const addToQueue = useCallback((message: Omit<QueuedMessage, 'id' | 'timestamp'>) => {
    const queuedMessage: QueuedMessage = {
      ...message,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    
    setQueue(prev => [...prev, queuedMessage]);
    return queuedMessage.id;
  }, []);

  const removeFromQueue = useCallback((messageId: string) => {
    setQueue(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  const getNextMessage = useCallback(() => {
    return queue[0] || null;
  }, [queue]);

  const dequeueMessage = useCallback(() => {
    if (queue.length === 0) return null;
    
    const nextMessage = queue[0];
    setQueue(prev => prev.slice(1));
    return nextMessage;
  }, [queue]);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  return {
    queue,
    addToQueue,
    removeFromQueue,
    getNextMessage,
    dequeueMessage,
    clearQueue,
    hasQueue: queue.length > 0,
    queueLength: queue.length,
  };
}