import type { LanguageModelV1Source } from '@ai-sdk/provider';
import {
  appendResponseMessages,
  type Message,
  smoothStream,
  streamText,
} from 'ai';
import { ChatStateStore } from '@/features/ai-chat/stores/chat-store';
import { llmProvider } from '@/features/ai-provider/services';
import { SettingsStateStore } from '@/features/settings/stores';
import { generateUUID } from '@/shared/utils';
import { devModeSystemPrompt, systemPrompt } from '../prompts';
import { tools } from '../tools';
import type { InstalledCap } from '@/features/cap/types';

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
  cap,
}: {
  sessionId: string;
  messages: Message[];
  signal?: AbortSignal;
  cap?: InstalledCap;
}) => {
  const { updateMessages } = ChatStateStore.getState();
  const isDevMode = SettingsStateStore.getState().settings.devMode;
  await updateMessages(sessionId, messages);

  const result = streamText({
    model: llmProvider.chat(),
    system: isDevMode ? devModeSystemPrompt() : systemPrompt(),
    messages,
    maxSteps: 5,
    experimental_transform: smoothStream({ chunking: 'word' }),
    experimental_generateMessageId: generateUUID,
    tools,
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
