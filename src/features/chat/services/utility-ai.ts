import { generateText, type Message } from 'ai';
import { generateUUID } from '@/shared/utils';
import { ChatStateStore } from '../stores';
import { llmProvider } from './providers';

// Generate a title from the first message a user begins a conversation with
// TODO: currently still using the remote AI models, need to switch to local models
export async function generateTitleFromUserMessage({
  chatId,
  message,
}: {
  chatId: string;
  message: Message;
}) {
  const { addPaymentCtxIdToChatSession } = ChatStateStore.getState();

  // create payment ctx id header
  const paymentCtxId = generateUUID();
  const headers = {
    'X-Client-Tx-Ref': paymentCtxId,
  };

  // add payment info to chat session
  await addPaymentCtxIdToChatSession(chatId, {
    type: 'generate-title',
    ctxId: paymentCtxId,
    timestamp: Date.now(),
  });

  const { text: title } = await generateText({
    model: llmProvider.utility(),
    system: `\n
        - you will generate a short title based on the first message a user begins a conversation with
        - ensure it is not more than 80 characters long
        - the title should be a summary of the user's message
        - do not use quotes or colons`,
    prompt: JSON.stringify(message),
    headers,
  });

  return title;
}
