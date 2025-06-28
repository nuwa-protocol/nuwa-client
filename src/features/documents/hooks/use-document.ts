'use client';

import { useCallback } from 'react';
import { DocumentStateStore } from '@/features/documents/stores';
import { useDocuments } from './use-documents';

export const useDocument = (id: string) => {
  const store = DocumentStateStore();
  const {
    updateDocumentContent,
    deleteDocument,
    addNewVersion,
    deleteAfterTimestamp,
  } = useDocuments();

  const document = store.getDocument(id);

  return {
    document,
    updateContent: useCallback(
      (content: string) => {
        updateDocumentContent(id, content);
      },
      [updateDocumentContent, id],
    ),
    deleteDocument: useCallback(() => {
      deleteDocument(id);
    }, [deleteDocument, id]),
    addNewVersion: useCallback(
      (content: string) => {
        addNewVersion(id, content);
      },
      [addNewVersion, id],
    ),
    deleteAfterTimestamp: useCallback(
      (updates: { content: string; timestamp: number }) => {
        deleteAfterTimestamp(id, updates);
      },
      [deleteAfterTimestamp, id],
    ),
  };
};
