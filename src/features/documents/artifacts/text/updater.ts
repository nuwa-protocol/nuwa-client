import { smoothStream, streamText } from 'ai';
import { llmProvider } from '@/features/ai-provider/services';

export const updateDocumentPrompt = (currentContent: string | null) =>
  `\
Improve the following contents of the document based on the given prompt.

${currentContent}
`;

export async function updateTextContent(
  currentContent: string,
  description: string,
  onDelta: (delta: string) => void,
): Promise<string> {
  let draftContent = '';

  const { fullStream } = streamText({
    model: llmProvider.artifact(),
    system: updateDocumentPrompt(currentContent),
    experimental_transform: smoothStream({ chunking: 'word' }),
    prompt: description,
    experimental_providerMetadata: {
      openai: {
        prediction: {
          type: 'content',
          content: currentContent,
        },
      },
    },
  });

  for await (const delta of fullStream) {
    if (delta.type === 'text-delta') {
      const { textDelta } = delta;
      draftContent += textDelta;
      onDelta(textDelta);
    }
  }

  return draftContent;
}
