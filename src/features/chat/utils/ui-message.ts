import type { Message, UIMessage } from 'ai';

export function convertToUIMessage(message: Message): UIMessage {
  if (!message.parts) {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      parts: [],
    };
  }
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    parts: message.parts,
  };
}
