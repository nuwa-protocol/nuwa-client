'use client';

import { ChatSDKError } from '@/shared/errors/chatsdk-errors';
import { handleAIRequest } from './handler';
import { CapStateStore } from '@/features/cap/stores/cap-store';

export const createClientAIFetch = (getCapId?: () => string | undefined): ((
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>) => {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      if (!init || !init.body) {
        throw new Error('Request body is required');
      }

      const requestBody = JSON.parse(init.body as string);
      const { id: sessionId, messages } = requestBody;

      let cap = null;
      if (getCapId) {
        const capId = getCapId();
        if (capId !== undefined) {
          cap = CapStateStore.getState().getInstalledCap(capId);
        }
      } 

      const response = await handleAIRequest({
        sessionId,
        messages,
        signal: init?.signal ?? undefined,
        cap: cap ?? undefined,
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
