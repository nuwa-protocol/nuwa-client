'use client';

import { CopyIcon } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { useCopyToClipboard } from 'usehooks-ts';
import { toast } from '@/shared/components/toast';
import { useLocale } from '@/shared/locales/use-locale';

interface CodeBlockProps {
  node: any;
  inline: boolean;
  className: string;
  children: any;
}

export function CodeBlock({
  node,
  inline,
  className,
  children,
  ...props
}: CodeBlockProps) {
  const { t } = useLocale();
  const [_, copyToClipboard] = useCopyToClipboard();

  if (!inline) {
    // Extract code as string for copying
    const codeString = Array.isArray(children) ? children.join('') : String(children);
    return (
      <div className="not-prose flex flex-col relative group">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-7 w-7 min-w-0 min-h-0"
                onClick={async () => {
                  if (!codeString) {
                    toast({ type: 'error', description: t('artifact.code.copyCode') });
                    return;
                  }
                  await copyToClipboard(codeString);
                  toast({ type: 'success', description: t('artifact.copied') });
                }}
                tabIndex={0}
                aria-label={t('artifact.code.copyCode')}
              >
                <CopyIcon size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('artifact.code.copyCode')}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <pre
          {...props}
          className={`text-sm w-full overflow-x-auto dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl dark:text-zinc-50 text-zinc-900`}
        >
          <code className="whitespace-pre-wrap break-words">{children}</code>
        </pre>
      </div>
    );
  } else {
    return (
      <code
        className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded-md`}
        {...props}
      >
        {children}
      </code>
    );
  }
}
