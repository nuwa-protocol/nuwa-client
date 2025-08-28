import type { ComponentProps, HTMLAttributes } from 'react';
import { memo, useMemo } from 'react';
import { CapUIRenderer } from '@/features/chat/components/capui-renderer-embed';
import { Response } from './message-ai';

function parseCapUIAttributes(text: string): { url: string; height: number; title?: string } | null {
  const match = text.match(/^\[capui:(.+?)\]$/);
  if (!match) return null;

  const attributesString = match[1];
  const attributes: Record<string, string> = {};

  const attrRegex = /(\w+)="([^"]+)"/g;
  let attrMatch: RegExpExecArray | null = attrRegex.exec(attributesString);

  while (attrMatch) {
    attributes[attrMatch[1]] = attrMatch[2];
    attrMatch = attrRegex.exec(attributesString);
  }

  const url = attributes.url;
  const heightStr = attributes.height;
  const title = attributes.title;

  if (!url || !heightStr) return null;

  const height = Number.parseInt(heightStr, 10);
  if (Number.isNaN(height)) return null;

  return { url, height, title };
}

interface CapUIMarkdownProps extends HTMLAttributes<HTMLDivElement> {
  children: string;
  allowedImagePrefixes?: ComponentProps<typeof Response>['allowedImagePrefixes'];
  allowedLinkPrefixes?: ComponentProps<typeof Response>['allowedLinkPrefixes'];
  defaultOrigin?: ComponentProps<typeof Response>['defaultOrigin'];
  parseIncompleteMarkdown?: ComponentProps<typeof Response>['parseIncompleteMarkdown'];
}

export const ResponseWithCapUI = memo(
  ({
    children,
    allowedImagePrefixes,
    allowedLinkPrefixes,
    defaultOrigin,
    parseIncompleteMarkdown,
    className,
    ...props
  }: CapUIMarkdownProps) => {
    const processedContent = useMemo(() => {
      if (typeof children !== 'string') {
        return [{ type: 'markdown', content: children }];
      }

      const parts: Array<{ type: 'markdown' | 'capui'; content: any }> = [];
      const lines = children.split('\n');
      let currentMarkdown = '';

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('[capui:') && trimmedLine.endsWith(']')) {
          // Save any accumulated markdown
          if (currentMarkdown.trim()) {
            parts.push({ type: 'markdown', content: currentMarkdown.trim() });
            currentMarkdown = '';
          }

          // Parse and add CapUI component
          const capuiData = parseCapUIAttributes(trimmedLine);
          if (capuiData) {
            parts.push({ type: 'capui', content: capuiData });
          } else {
            // If parsing failed, treat as regular markdown
            currentMarkdown += line + '\n';
          }
        } else {
          currentMarkdown += line + '\n';
        }
      }

      // Add any remaining markdown
      if (currentMarkdown.trim()) {
        parts.push({ type: 'markdown', content: currentMarkdown.trim() });
      }

      return parts;
    }, [children]);

    return (
      <div className={className} {...props}>
        {processedContent.map((part, index) => {
          if (part.type === 'capui') {
            const data = part.content as { url: string; height: number; title?: string };
            return (
              <CapUIRenderer
                key={data.url}
                srcUrl={data.url}
                height={data.height}
                title={data.title}
              />
            );
          } else {
            return (
              <Response
                key={part.content}
                allowedImagePrefixes={allowedImagePrefixes}
                allowedLinkPrefixes={allowedLinkPrefixes}
                defaultOrigin={defaultOrigin}
                parseIncompleteMarkdown={parseIncompleteMarkdown}
              >
                {part.content}
              </Response>
            );
          }
        })}
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);

ResponseWithCapUI.displayName = 'ResponseWithCapUI';