import {
  appendResponseMessages,
  type Message,
  smoothStream,
  streamText,
} from 'ai';
import { ChatStateStore } from '@/features/ai-chat/stores/chat-store';
import { ModelStateStore } from '@/features/ai-chat/stores/model-store';
import { generateUUID } from '@/shared/utils';
import { systemPrompt } from '../prompts';
import { myProvider } from '../providers';
import { createDocument } from '../tools/create-document';
import { updateDocument } from '../tools/update-document';

// Default model to use
const DEFAULT_CHAT_MODEL = 'chat-model';

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
  const { updateMessages, createStreamId } = ChatStateStore.getState();

  await updateMessages(sessionId, messages);

  // Create streamId for stream resumption
  const streamId = generateUUID();
  createStreamId(streamId, sessionId);

  // get selected model
  const selectedModel = ModelStateStore.getState().selectedModel;

  const result = streamText({
    model: myProvider.languageModel(DEFAULT_CHAT_MODEL),
    system: systemPrompt(),
    messages,
    maxSteps: 5,
    experimental_activeTools: selectedModel.supports.function_calling
      ? ['createDocument', 'updateDocument']
      : [],
    experimental_transform: smoothStream({ chunking: 'word' }),
    experimental_generateMessageId: generateUUID,
    tools: {
      createDocument: createDocument(),
      updateDocument: updateDocument(),
    },
    abortSignal: signal,
    async onFinish({ response }) {
      const finalMessages = appendResponseMessages({
        messages: messages,
        responseMessages: response.messages,
      });

      await updateMessages(sessionId, finalMessages);
    },
  });

  const dataStreamResponse = result.toDataStreamResponse({
    getErrorMessage: errorHandler,
  });

  return dataStreamResponse;

  // To do: add stream resumption
  // const streamContext = getStreamContext();

  // if (streamContext) {
  //   const resumedStream = await streamContext.resumableStream(
  //     streamId,
  //     () => dataStreamResponse.body!
  //   );
  //   return new Response(resumedStream);
  // } else {
  //   return dataStreamResponse;
  // }
};

export { handleAIRequest };
