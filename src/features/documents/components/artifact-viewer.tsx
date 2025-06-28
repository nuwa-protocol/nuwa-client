import type { UseChatHelpers } from '@ai-sdk/react';
import { formatDistance } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { useDebounceCallback } from 'usehooks-ts';
import { ArtifactActions } from './artifact-actions';
import { ArtifactCloseButton } from './artifact-close-button';
import { VersionFooter } from './version-footer';
import { artifactDefinitions } from '@/features/documents/artifacts';
import { useCurrentDocument } from '@/features/documents/hooks/use-document-current';
import { useDocuments } from '@/features/documents/hooks/use-documents';
import type { Document } from '@/features/documents/stores';

interface ArtifactViewerProps {
  chatId: string;
  status: UseChatHelpers['status'];
}

export function ArtifactViewer({ chatId, status }: ArtifactViewerProps) {
  const {
    currentDocument: artifact,
    setCurrentDocument,
    metadata,
    setMetadata,
  } = useCurrentDocument();
  const {
    documentsMap,
    getDocuments,
    updateDocumentContent,
  } = useDocuments();

  // Use document store instead of SWR
  const [versionedDocuments, setVersionedDocuments] = useState<Array<Document>>(
    [],
  );

  useEffect(() => {
    if (artifact.documentId !== 'init' && artifact.status !== 'streaming') {
      const currentDocuments = getDocuments(artifact.documentId);
      if (currentDocuments) {
        setVersionedDocuments(currentDocuments);
      }
    }
  }, [documentsMap, artifact.documentId, artifact.status]); // Remove getDocuments from dependencies

  const [mode, setMode] = useState<'edit' | 'diff'>('edit');
  const [document, setDocument] = useState<Document | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

  useEffect(() => {
    if (versionedDocuments && versionedDocuments.length > 0) {
      const mostRecentDocument = versionedDocuments.at(-1);

      if (mostRecentDocument) {
        setDocument(mostRecentDocument);
        setCurrentVersionIndex(versionedDocuments.length - 1);
        
        // Only update if content is actually different to prevent infinite loops
        setCurrentDocument((currentDocument) => {
          if (currentDocument.content !== (mostRecentDocument.content ?? '')) {
            return {
              ...currentDocument,
              content: mostRecentDocument.content ?? '',
            };
          }
          return currentDocument;
        });
      }
    }
  }, [versionedDocuments]); // Remove setCurrentDocument from dependencies

  const [isContentDirty, setIsContentDirty] = useState(false);

  const handleContentChange = useCallback(
    (updatedContent: string) => {
      if (!artifact || !document) return;

      if (document.content !== updatedContent) {
        // Update document in local store
        updateDocumentContent(artifact.documentId, updatedContent);

        setIsContentDirty(false);

        // Update local state - update the current document in the array instead of replacing the whole array
        setVersionedDocuments(prevVersions => {
          const updatedVersions = [...prevVersions];
          const currentIndex = updatedVersions.findIndex(doc => doc.id === document.id);
          
          if (currentIndex !== -1) {
            updatedVersions[currentIndex] = {
              ...document,
              content: updatedContent,
              updatedAt: Date.now(),
            };
          }
          
          return updatedVersions;
        });
      }
    },
    [artifact, document, updateDocumentContent],
  );

  const debouncedHandleContentChange = useDebounceCallback(
    handleContentChange,
    2000,
  );

  const saveContent = useCallback(
    (updatedContent: string, debounce: boolean) => {
      if (document && updatedContent !== document.content) {
        setIsContentDirty(true);

        if (debounce) {
          debouncedHandleContentChange(updatedContent);
        } else {
          handleContentChange(updatedContent);
        }
      }
    },
    [document, debouncedHandleContentChange, handleContentChange],
  );

  function getDocumentContentById(index: number) {
    if (!versionedDocuments) return '';
    if (!versionedDocuments[index]) return '';
    return versionedDocuments[index].content ?? '';
  }

  const handleVersionChange = (type: 'next' | 'prev' | 'toggle' | 'latest') => {
    if (!versionedDocuments) return;

    if (type === 'latest') {
      setCurrentVersionIndex(versionedDocuments.length - 1);
      setMode('edit');
    }

    if (type === 'toggle') {
      setMode((mode) => (mode === 'edit' ? 'diff' : 'edit'));
    }

    if (type === 'prev') {
      if (currentVersionIndex > 0) {
        setCurrentVersionIndex((index) => index - 1);
      }
    } else if (type === 'next') {
      if (currentVersionIndex < versionedDocuments.length - 1) {
        setCurrentVersionIndex((index) => index + 1);
      }
    }
  };

  /*
   * NOTE: if there are no documents, or if
   * the documents are being fetched, then
   * we mark it as the current version.
   */

  const isCurrentVersion =
    versionedDocuments && versionedDocuments.length > 0
      ? currentVersionIndex === versionedDocuments.length - 1
      : true;

  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact.kind,
  );

  if (!artifactDefinition) {
    throw new Error('Artifact definition not found!');
  }

  useEffect(() => {
    if (artifact.documentId !== 'init') {
      if (artifactDefinition.initialize) {
        artifactDefinition.initialize({
          documentId: artifact.documentId,
          setMetadata,
        });
      }
    }
  }, [artifact.documentId, artifactDefinition, setMetadata]);

  return (
    <div
      data-testid="artifact-viewer"
      className="dark:bg-muted bg-background h-dvh flex flex-col overflow-y-scroll md:border-r dark:border-zinc-700 border-zinc-200 transition-all duration-300 ease-in-out animate-fade-in"
    >
      <div className="p-2 flex flex-row justify-between items-start">
        <div className="flex flex-row gap-4 items-start">
          <ArtifactCloseButton chatId={chatId} />

          <div className="flex flex-col">
            <div className="font-medium">{artifact.title}</div>

            {isContentDirty ? (
              <div className="text-sm text-muted-foreground">
                Saving changes...
              </div>
            ) : document ? (
              <div className="text-sm text-muted-foreground">
                {`Updated ${formatDistance(
                  new Date(document.updatedAt),
                  new Date(),
                  {
                    addSuffix: true,
                  },
                )}`}
              </div>
            ) : (
              <div className="w-32 h-3 mt-2 bg-muted-foreground/20 rounded-md animate-pulse" />
            )}
          </div>
        </div>

        <ArtifactActions
          artifact={artifact}
          currentVersionIndex={currentVersionIndex}
          handleVersionChange={handleVersionChange}
          isCurrentVersion={isCurrentVersion}
          mode={mode}
          metadata={metadata}
          setMetadata={setMetadata}
        />
      </div>

      <div className="dark:bg-muted bg-background h-full overflow-y-scroll !max-w-full items-center">
        <artifactDefinition.content
          title={artifact.title}
          content={
            isCurrentVersion
              ? artifact.content
              : getDocumentContentById(currentVersionIndex)
          }
          mode={mode}
          status={artifact.status === 'streaming' ? 'streaming' : 'idle'}
          currentVersionIndex={currentVersionIndex}
          onSaveContent={saveContent}
          isInline={false}
          isCurrentVersion={isCurrentVersion}
          getDocumentContentById={getDocumentContentById}
          isLoading={!artifact.content}
          metadata={metadata}
          setMetadata={setMetadata}
        />
      </div>

      {!isCurrentVersion && (
        <VersionFooter
          currentVersionIndex={currentVersionIndex}
          documents={versionedDocuments}
          handleVersionChange={handleVersionChange}
        />
      )}
    </div>
  );
}
