import { streamObject } from 'ai';
import z from 'zod';
import { llmProvider } from '@/features/ai-provider/services';

export const generateCodePrompt = `
You are a Python code generator that creates self-contained, executable code snippets. When writing code:

1. Each snippet should be complete and runnable on its own
2. Prefer using print() statements to display outputs
3. Include helpful comments explaining the code
4. Keep snippets concise (generally under 15 lines)
5. Avoid external dependencies - use Python standard library
6. Handle potential errors gracefully
7. Return meaningful output that demonstrates the code's functionality
8. Don't use input() or other interactive functions
9. Don't access files or network resources
10. Don't use infinite loops

Examples of good snippets:

# Calculate factorial iteratively
def factorial(n):
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

print(f"Factorial of 5 is: {factorial(5)}")
`;

export async function generateCodeContent(
  title: string,
  onDelta: (delta: string) => void,
): Promise<string> {
  let draftContent = '';

  const { fullStream } = streamObject({
    model: llmProvider.artifact(),
    system: generateCodePrompt,
    prompt: title,
    schema: z.object({
      code: z.string(),
    }),
  });

  for await (const delta of fullStream) {
    if (delta.type === 'object' && delta.object.code) {
      draftContent = delta.object.code;
      onDelta(delta.object.code);
    }
  }

  return draftContent;
}
