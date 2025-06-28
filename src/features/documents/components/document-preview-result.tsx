import { FileIcon, PencilIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { memo } from 'react';

import { toast } from '@/shared/components/toast';

import type { ArtifactKind } from '@/features/documents/artifacts';
import { useCurrentDocument } from '@/features/documents/hooks/use-document-current';
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

interface DocumentToolResultProps {
  chatId: string;
  type: 'create' | 'update' | 'request-suggestions';
  result: { id: string; title: string; kind: ArtifactKind };
  isReadonly: boolean;
}

function PureDocumentToolResult({
  chatId,
  type,
  result,
  isReadonly,
}: DocumentToolResultProps) {
  const { setCurrentDocument } = useCurrentDocument();
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className="bg-background cursor-pointer border py-2 px-3 rounded-xl w-fit flex flex-row gap-3 items-start"
      onClick={(event) => {
        if (isReadonly) {
          toast({
            description: t('documentTool.viewingNotSupported'),
            type: 'error',
          });
          return;
        }

        setCurrentDocument({
          documentId: result.id,
          kind: result.kind,
          content: '',
          title: result.title,
          status: 'idle',
        });
        navigate(`/artifact?cid=${chatId}`);
      }}
    >
      <div className="text-muted-foreground mt-1">
        {type === 'create' ? (
          <FileIcon size={16} />
        ) : type === 'update' ? (
          <PencilIcon size={16} />
        ) :  null}
      </div>
      <div className="text-left">
        {`${getActionText(type, 'past', t)} "${result.title}"`}
      </div>
    </button>
  );
}

export const DocumentToolResult = memo(PureDocumentToolResult, () => true);
