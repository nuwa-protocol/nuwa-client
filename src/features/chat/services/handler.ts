import type { LanguageModelV1Source } from '@ai-sdk/provider';
import {
  appendResponseMessages,
  type Message,
  smoothStream,
  streamText,
} from 'ai';
import { generateUUID } from '@/shared/utils';
import { ChatStateStore } from '../stores';
import { CapResolve } from './cap-resolve';

// Error handling function
function errorHandler(error: unknown) {
  if (error == null) {
    return 'unknown error';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return JSON.stringify(error);
}

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
const handleAIRequest = async ({
  sessionId,
  messages,
  signal,
}: {
  sessionId: string;
  messages: Message[];
  signal?: AbortSignal;
}) => {
  // Resolve cap configuration
  const capResolve = new CapResolve();
  const { prompt, model, tools } = await capResolve.getResolvedConfig();

  // update the messages state
  const { updateMessages } = ChatStateStore.getState();
  updateMessages(sessionId, messages);

  const result = streamText({
    model,
    system: prompt,
    messages,
    maxSteps: 5,
    experimental_transform: smoothStream({ chunking: 'word' }),
    experimental_generateMessageId: generateUUID,
    tools,
    abortSignal: signal,
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
      updateMessages(sessionId, finalMessagesWithSources);
    },
  });

  // stream the response
  const dataStreamResponse = result.toDataStreamResponse({
    getErrorMessage: errorHandler,
    sendReasoning: true,
    sendSources: true,
  });

  return dataStreamResponse;
};

export { handleAIRequest };
