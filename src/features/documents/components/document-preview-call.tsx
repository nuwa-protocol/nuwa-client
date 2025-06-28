import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileIcon, LoaderIcon, PencilIcon } from 'lucide-react';

import { toast } from '@/shared/components/toast';

import { useLanguage } from '@/shared/hooks/use-language';

const getActionText = (
  type: 'create' | 'update' | 'request-suggestions',
  tense: 'present' | 'past',
  t: (key: string) => string,
) => {
  switch (type) {
    case 'create':
      return tense === 'present'
        ? t('documentTool.creating')
        : t('documentTool.created');
    case 'update':
      return tense === 'present'
        ? t('documentTool.updating')
        : t('documentTool.updated');
    case 'request-suggestions':
      return tense === 'present'
        ? t('documentTool.addingSuggestions')
        : t('documentTool.addedSuggestions');
    default:
      return null;
  }
};

interface DocumentToolCallProps {
  chatId: string;
  type: 'create' | 'update' | 'request-suggestions';
  args: { title: string };
  isReadonly: boolean;
}

function PureDocumentToolCall({
  chatId,
  type,
  args,
  isReadonly,
}: DocumentToolCallProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="cursor pointer w-fit border py-2 px-3 rounded-xl flex flex-row items-start justify-between gap-3"
      onClick={(event) => {
        if (isReadonly) {
          toast({
            description: t('documentTool.viewingNotSupported'),
            type: 'error',
          });
          return;
        }

        navigate(`/artifact?cid=${chatId}`);
      }}
    >
      <div className="flex flex-row gap-3 items-start">
        <div className="text-zinc-500 mt-1">
          {type === 'create' ? (
            <FileIcon size={16} />
          ) : type === 'update' ? (
            <PencilIcon size={16} />
          ) : null}
        </div>

        <div className="text-left">
          {`${getActionText(type, 'present', t)} ${args.title ? `"${args.title}"` : ''}`}
        </div>
      </div>

      <div className="animate-spin mt-1">{<LoaderIcon />}</div>
    </button>
  );
}

export const DocumentToolCall = memo(PureDocumentToolCall, () => true);
