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
      const { id: sessionId, messages } = requestBody;

      const response = await handleAIRequest({
        sessionId,
        messages,
        signal: init?.signal ?? undefined,
      });

      return response;
    } catch (error) {
      // 记录错误详情以便调试
      console.error('AI request error:', error);
      
      if (error instanceof ChatSDKError) {
        return new Response(JSON.stringify({ error: 'AI request failed' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      // 提供更具体的错误信息
      let errorMessage = 'Unknown error occurred';
      let additionalInfo = '';

      if (error instanceof Error) {
        errorMessage = error.message;
        
        // 针对常见错误提供更好的用户体验
        if (error.message.includes('No cap selected')) {
          errorMessage = 'Please select a Cap before sending messages';
          additionalInfo = 'Click the "Select Cap" button to choose an AI assistant';
        } else if (error.message.includes('Failed to sign DIDAuth')) {
          errorMessage = 'Authentication failed';
          additionalInfo = 'Please check your login status and try again';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Network connection failed';
          additionalInfo = 'Please check your internet connection and try again';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timeout';
          additionalInfo = 'The AI service is taking too long to respond. Please try again';
        }
      }

      return new Response(JSON.stringify({ 
        error: errorMessage,
        details: additionalInfo,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  };
};

export { generateTitleFromUserMessage } from './utility-ai';
