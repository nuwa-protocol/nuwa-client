import type { LanguageModelV1Source } from '@ai-sdk/provider';
import {
  appendResponseMessages,
  type Message,
  smoothStream,
  streamText,
} from 'ai';
import { ChatStateStore } from '@/features/ai-chat/stores/chat-store';
import { llmProvider } from '@/features/ai-provider/services';
import { CapStateStore } from '@/features/cap/stores';
import { SettingsStateStore } from '@/features/settings/stores';
import { generateUUID } from '@/shared/utils';
import { devModeSystemPrompt, systemPrompt } from '../prompts';
import { tools } from '../tools';
import { generateTitleFromUserMessage } from '../utility-ai';

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
  const { updateMessages, readSession, updateSession } = ChatStateStore.getState();
  const isDevMode = SettingsStateStore.getState().settings.devMode;
  
  // Check if this is a new session
  const existingSession = readSession(sessionId);
  const isNewSession = !existingSession;
  
  // Get current cap information
  const { currentCap } = CapStateStore.getState();
  
  // Update messages with cap information if this is a new session
  if (isNewSession && currentCap) {
    await updateMessages(sessionId, messages);
    await updateSession(sessionId, {
      capId: currentCap.id,
      capVersion: currentCap.version,
    });
  } else {
    await updateMessages(sessionId, messages);
  }

  const prompt = isDevMode ? (currentCap? currentCap.prompt: devModeSystemPrompt()) : systemPrompt();

  const result = streamText({
    model: llmProvider.chat(),
    system: prompt,
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
      
      // Generate title for new sessions
      if (isNewSession && finalMessagesWithSources.length > 0) {
        const firstUserMessage = finalMessagesWithSources.find(
          (msg) => msg.role === 'user',
        );
        if (firstUserMessage) {
          try {
            const title = await generateTitleFromUserMessage({
              message: firstUserMessage,
            });
            await updateSession(sessionId, { title });
          } catch (error) {
            console.error('Failed to generate title with AI:', error);
          }
        }
      }
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
