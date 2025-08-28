import type { LanguageModelV1Source } from '@ai-sdk/provider';
import {
  appendResponseMessages,
  type Message,
  smoothStream,
  streamText,
} from 'ai';
import { generateUUID } from '@/shared/utils';
import { ChatStateStore } from '../stores';
import { getErrorMessage } from '../utils';
import { CapResolve } from './cap-resolve';

function appendSourcesToFinalMessages(
  finalMessages: Message[],
  messageId: string,
  sources: LanguageModelV1Source[],
): Message[] {
  return finalMessages.map((message) => {
    if (message.id === messageId) {
      return {
        ...message,
        parts: [
          ...(message.parts ?? []),
          ...sources.map((source) => ({
            type: 'source' as const,
            source,
          })),
        ],
      };
    }
    return message;
  });
}

// Handle AI request, entrance of the AI workflow
export const handleAIRequest = async ({
  chatId,
  messages,
  signal,
}: {
  chatId: string;
  messages: Message[];
  signal?: AbortSignal;
}) => {
  // Resolve cap configuration
  const capResolve = new CapResolve();
  const { prompt, model, tools } = await capResolve.getResolvedConfig();

  // create a new chat session and update the messages
  const { updateMessages, addPaymentCtxIdToChatSession } =
    ChatStateStore.getState();
  await updateMessages(chatId, messages);

  // create payment CTX id header
  const paymentCtxId = generateUUID();
  const headers = {
    'X-Client-Tx-Ref': paymentCtxId,
  };

  // add payment info to chat session
  await addPaymentCtxIdToChatSession(chatId, {
    type: 'chat-message',
    message: messages[messages.length - 1].content,
    ctxId: paymentCtxId,
    timestamp: Date.now(),
  });

  const result = streamText({
    model,
    system: prompt,
    messages,
    maxSteps: 5,
    experimental_transform: smoothStream({ chunking: 'word' }),
    experimental_generateMessageId: generateUUID,
    tools,
    abortSignal: signal,
    maxRetries: 3,
    headers,
    async onFinish({ response, sources }) {
      // append response messages
      const finalMessages = appendResponseMessages({
        messages: messages,
        responseMessages: response.messages,
      });

      // the appendResponseMessages function above does not append sources to the final messages
      // so we need to append them manually
      const finalMessagesWithSources = appendSourcesToFinalMessages(
        finalMessages,
        response.messages[0].id,
        sources,
      );

      // update the messages state
      await updateMessages(chatId, finalMessagesWithSources);
    },
  });

  // stream the response
  const dataStreamResponse = result.toDataStreamResponse({
    getErrorMessage,
    sendReasoning: true,
    sendSources: true,
  });

  return dataStreamResponse;
};
