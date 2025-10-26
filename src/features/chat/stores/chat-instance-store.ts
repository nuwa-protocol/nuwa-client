// chat-instance-store.ts
// Store for managing Chat instances in memory without persistence

import { Chat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { create } from 'zustand';
import { handleError } from '@/shared/utils/handle-error';
import { ClientChatTransport } from '../services';

interface ChatInstanceStoreState {
  instances: Map<string, Chat<UIMessage>>;

  // Instance management
  getInstance: (
    chatId: string,
    initialMessages: UIMessage[],
    callbacks: {
      onFinish: () => void;
      onData: (data: any) => void;
    },
  ) => Chat<UIMessage>;
}

export const ChatInstanceStore = create<ChatInstanceStoreState>()(
  (set, get) => ({
    instances: new Map<string, Chat<UIMessage>>(),

    getInstance: (chatId: string, initialMessages: UIMessage[], callbacks) => {
      const { instances } = get();

      // Check if instance already exists
      const existingInstance = instances.get(chatId);
      if (existingInstance) {
        // Sync persisted messages into the existing instance. This handles the
        // case where the instance was created before the store finished
        // rehydrating (e.g. page refresh on a chat route) and therefore missed
        // the historical messages. Once rehydration completes we get called
        // again with the restored message list and need to push it into the chat
        // instance so the UI renders them.
        const persistedMessages = initialMessages || [];
        if (persistedMessages.length > 0) {
          const currentMessages = existingInstance.messages || [];
          const isDifferentLength =
            currentMessages.length !== persistedMessages.length;
          const hasDifferentIds =
            !isDifferentLength &&
            currentMessages.some(
              (message, index) =>
                message.id !== persistedMessages[index]?.id,
            );

          if (isDifferentLength || hasDifferentIds) {
            existingInstance.messages = persistedMessages;
          }
        }

        return existingInstance;
      }

      // Create new Chat instance
      const newChatInstance = new Chat({
        id: chatId,
        messages: initialMessages,
        transport: new ClientChatTransport(),
        onFinish: callbacks.onFinish,
        onData: callbacks.onData,
        onError: handleError,
      });

      // Store the new instance using queueMicrotask to avoid setState during render
      queueMicrotask(() => {
        set((state) => {
          const newInstances = new Map(state.instances);
          newInstances.set(chatId, newChatInstance);
          return { instances: newInstances };
        });
      });

      return newChatInstance;
    },
  }),
);
