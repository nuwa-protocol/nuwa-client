import { FileDiff } from 'lucide-react';
import { getLocaleText } from '@/shared/locales';
import type { ArtifactAction } from '../../types';

export function createVersionChangeAction(): ArtifactAction {

  return {
    icon: <FileDiff size={18} />,
    description: getLocaleText('en').t('artifact.text.actions.versionChange'),
    onClick: ({ handleVersionChange }) => {
      handleVersionChange('toggle');
    },
    isDisabled: ({ currentVersionIndex }) => {
      return currentVersionIndex === 0;
    },
  };
}
