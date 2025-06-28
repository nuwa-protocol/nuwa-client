import { Artifact } from '@/features/documents/artifacts/types';
import { createCopyAction } from './actions/copy';
import { createRedoAction } from './actions/redo';
import { createUndoAction } from './actions/undo';
import { SheetContent } from './components/sheet-content';

type Metadata = any;

export const createSheetArtifact = () => {
  return new Artifact<'sheet', Metadata>({
    kind: 'sheet',
    description: 'Sheet artifact for displaying spreadsheets',
    initialize: async () => {},
    content: SheetContent,
    actions: [createUndoAction(), createRedoAction(), createCopyAction()],
  });
};

export const sheetArtifact = createSheetArtifact();

export { generateSheetContent } from './generator';
export { updateSheetContent } from './updater';
