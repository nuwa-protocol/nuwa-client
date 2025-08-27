import type { LanguageModelV1Source } from '@ai-sdk/provider';
import {
  appendResponseMessages,
  type Message,
  smoothStream,
  streamText,
  APICallError,
} from 'ai';
import { generateUUID } from '@/shared/utils';
import { ChatStateStore } from '../stores';
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
    getErrorMessage: (error) => {
      if (error == null) {
        return 'unknown error';
      }

      if (typeof error === 'string') {
        return error;
      }

      if (error instanceof Error) {
        
        // Check if it's an APICallError
        if (APICallError.isInstance(error)) {
          const apiError = error as any; // Cast to access properties
          
          // Try to extract error from response body
          try {
            const responseBody = apiError.responseBody;
            if (responseBody && typeof responseBody === 'string') {
              const parsed = JSON.parse(responseBody);
              if (parsed.error) {
                // If the response body contains an error object, use it
                return JSON.stringify(parsed.error);
              }
            }
          } catch {
            // Failed to parse response body
          }
          
          // Fallback to structured error info
          const errorInfo: any = {
            message: error.message,
            name: error.name,
            statusCode: apiError.statusCode,
            responseBody: apiError.responseBody,
          };
          
          return JSON.stringify(errorInfo);
        }
        
        // For other Error types, try to get detailed information
        const errorInfo: any = {
          message: error.message,
          name: error.name,
        };
        
        // Check for payment-kit specific properties
        if ('code' in error) {
          errorInfo.code = (error as any).code;
        }
        if ('httpStatus' in error) {
          errorInfo.httpStatus = (error as any).httpStatus;
        }
        if ('details' in error) {
          errorInfo.details = (error as any).details;
        }
        
        // Return a structured error message that processErrorMessage can parse
        return JSON.stringify(errorInfo);
      }

      return JSON.stringify(error);
    },
    sendReasoning: true,
    sendSources: true,
  });

  return dataStreamResponse;
};
