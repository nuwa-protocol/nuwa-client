import type { LanguageModelV1Source } from '@ai-sdk/provider';
import {
  appendResponseMessages,
  type Message,
  smoothStream,
  streamText,
} from 'ai';
import { generateUUID } from '@/shared/utils';
import { ChatStateStore } from '../stores';
import { CurrentCapStore } from '@/shared/stores/current-cap-store';
import { llmProvider } from './providers';

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
  console.log('Starting AI request for session:', sessionId);
  
  // Get current cap from global state
  const { currentCap } = CurrentCapStore.getState();
  
  if (!currentCap) {
    console.error('No cap selected when attempting to send message');
    throw new Error('No cap selected. Please select a cap to use.');
  }

  console.log('Using cap:', { 
    id: currentCap.id, 
    name: currentCap.name, 
    modelId: currentCap.model.id 
  });

  // update the messages state
  const { updateMessages } = ChatStateStore.getState();
  await updateMessages(sessionId, messages);

  const result = streamText({
    model: llmProvider.chat(currentCap.model.id),
    system: currentCap.prompt,
    messages,
    maxSteps: 5,
    experimental_transform: smoothStream({ chunking: 'word' }),
    experimental_generateMessageId: generateUUID,
    tools: {},
    abortSignal: signal,
    async onFinish({ response, reasoning, sources }) {
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
      await updateMessages(sessionId, finalMessagesWithSources);
    },
  });

  const dataStreamResponse = result.toDataStreamResponse({
    getErrorMessage: errorHandler,
    sendReasoning: true,
    sendSources: true,
  });

  return dataStreamResponse;
};

export { handleAIRequest };
