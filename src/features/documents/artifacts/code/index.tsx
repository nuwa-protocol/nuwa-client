import { Artifact } from '../types';
import { CodeContent } from './components/code-content';
import type { ConsoleOutput } from './components/console';
import { createRunCodeAction } from './actions/run-code';
import { createUndoAction } from './actions/undo';
import { createRedoAction } from './actions/redo';
import { createCopyAction } from './actions/copy';

// export functions for external use
export { generateCodeContent } from './generator';
export { updateCodeContent } from './updater';

interface Metadata {
  outputs: Array<ConsoleOutput>;
}

export const createCodeArtifact = () => {
  return new Artifact<'code', Metadata>({
    kind: 'code',
    description: 'Code artifact for running and displaying code',
  initialize: async ({ setMetadata }) => {
    setMetadata({ outputs: [] });
  },
  content: CodeContent,
  actions: [
    createRunCodeAction(),
    createUndoAction(),
    createRedoAction(),
    createCopyAction(),
  ]
  });
};

export const codeArtifact = createCodeArtifact();
