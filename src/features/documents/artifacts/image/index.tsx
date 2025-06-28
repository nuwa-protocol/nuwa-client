import { Artifact } from '@/features/documents/artifacts/types';
import { createCopyAction } from './actions/copy';
import { createRedoAction } from './actions/redo';
import { createUndoAction } from './actions/undo';
import { ImageContent } from './components/image-content';

export const createImageArtifact = () => {
  return new Artifact({
    kind: 'image',
    description: 'Image artifact for displaying images',
  content: ImageContent,
    actions: [createUndoAction(), createRedoAction(), createCopyAction()],
  });
};

export const imageArtifact = createImageArtifact();

export { generateImageContent } from './generator';
export { updateImageContent } from './updater';
