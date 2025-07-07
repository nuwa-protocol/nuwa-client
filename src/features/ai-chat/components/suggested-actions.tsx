'use client';

import type { UseChatHelpers } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { Button } from '@/shared/components/ui';
import { useLanguage } from '@/shared/hooks/use-language';
import { useInstalledCaps } from "@/features/cap/hooks";

interface SuggestedActionsProps {
  append: UseChatHelpers['append'];
}

function PureSuggestedActions({ append }: SuggestedActionsProps) {
  const { t } = useLanguage();
  const {
    installedCaps,
  } = useInstalledCaps();
  const suggestedActions = t('suggestedActions') as Array<{
    title: string;
    label: string;
    action: string;
  }>;
  
  console.log(installedCaps);

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
       {installedCaps.map((caps, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${caps.name}-${index}`}
          className={index > 1 ? "hidden sm:block" : "block"}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              append({
                role: "user",
                content: caps.cap?.prompt ?? '',
                data: {
                  capId: caps.id,
                  capName: caps.name,
                },
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{caps.name}</span>
            {/* <span className="text-muted-foreground">
              {caps.description}
            </span> */}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions);
