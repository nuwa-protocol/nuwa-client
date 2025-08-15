import { ChatSDKError } from '../errors/chatsdk-errors';
import { handleAIRequest } from './handler';

export const createClientAIFetch = (): ((
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>) => {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (!init || !init.body) {
        throw new Error('Request body is required');
      }

      const requestBody = JSON.parse(init.body as string);
      const { id: chatId, messages } = requestBody;

      const response = await handleAIRequest({
        chatId,
        messages,
        signal: init?.signal ?? undefined,
      });

      return response;
    } catch (error) {
      if (error instanceof ChatSDKError) {
        return new Response(JSON.stringify({ error: 'AI request failed' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      return new Response(JSON.stringify({ error: 'Unknown error occurred' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  };
};

export { generateTitleFromUserMessage } from './utility-ai';
