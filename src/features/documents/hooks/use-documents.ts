import { useCallback } from 'react';
import { DocumentStateStore } from '@/features/documents/stores';
import type { Document } from '@/features/documents/types';
import { generateUUID } from '@/shared/utils';

// Documents management hook with business logic
export const useDocuments = () => {
  const store = DocumentStateStore();

  // 创建文档（使用服务层）
  const createDocument = useCallback(
    (title: string, kind: Document['kind']) => {
      const id = generateUUID();
      store.createDocumentWithId(id, title, kind);
      return id;
    },
    [],
  );

  // 创建指定 ID 的文档
  const createDocumentWithId = useCallback(
    (id: string, title: string, kind: Document['kind'], content?: string) => {
      store.createDocumentWithId(id, title, kind, content);
    },
    [],
  );

  // 更新文档内容
  const updateDocumentContent = useCallback(
    (id: string, content: string) => {
      const existingDocument = store.getDocument(id);
      if (!existingDocument) return;

      const updatedDocument: Document = {
        ...existingDocument,
        content,
      };

      store.updateDocument(id, updatedDocument);
    },
    [store],
  );

  // 删除文档
  const deleteDocument = useCallback(
    (id: string) => {
      store.deleteDocument(id);
    },
    [store],
  );

  // 添加新版本文档
  const addNewVersion = useCallback(
    (id: string, content: string) => {
      const originalDocument = store.getDocument(id);
      if (!originalDocument) return;

      const versionId = generateUUID();
      const now = Date.now();

      const versionDocument: Document = {
        ...originalDocument,
        id: versionId,
        content,
        createdAt: now,
        updatedAt: now,
      };

      store.updateDocument(versionId, versionDocument);
    },
    [store],
  );

  // 删除指定时间戳后的文档版本
  const deleteAfterTimestamp = useCallback(
    (id: string, updates: { content: string; timestamp: number }) => {
      store.deleteDocumentAfterTimestamp(id, updates);
    },
    [store],
  );

  // 获取排序后的文档
  const getSortedDocuments = useCallback(() => {
    return Object.values(store.documents).sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
  }, [store.documents]);

  // 清空所有文档
  const clearAllDocuments = useCallback(() => {
    store.clearAllDocuments();
  }, [store]);

  return {
    documents: store.documents,
    documentsMap: store.documents,
    getDocument: store.getDocument,
    getDocuments: store.getDocuments,
    createDocument,
    createDocumentWithId,
    updateDocumentContent,
    deleteDocument,
    addNewVersion,
    deleteAfterTimestamp,
    getSortedDocuments,
    clearAllDocuments,
  };
};
