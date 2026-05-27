import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import {
  buildGroundedTextFromSelection,
  readGroundedFileAsText,
  type GroundedDocSelection,
} from '../utils/groundedContext';
import { getGroundedSessionId } from '../utils/groundedSession';

export function useGroundedDocumentsConvex() {
  const sessionId = getGroundedSessionId();

  const documents = useQuery(api.groundedDocuments.listBySession, { sessionId });
  const createFromText = useMutation(api.groundedDocuments.createFromText);
  const removeDocument = useMutation(api.groundedDocuments.remove);

  const [selectedDocIds, setSelectedDocIds] = useState<Id<'groundedDocuments'>[]>([]);
  const [manualGroundedText, setManualGroundedText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const selectedDocs: GroundedDocSelection[] = useMemo(() => {
    if (!documents) return [];
    return documents
      .filter((doc) => selectedDocIds.includes(doc._id))
      .map((doc) => ({
        id: doc._id,
        name: doc.name,
        mimeType: doc.mimeType,
        textContent: doc.textContent,
      }));
  }, [documents, selectedDocIds]);

  const effectiveGroundedText = useMemo(
    () => buildGroundedTextFromSelection(selectedDocs, manualGroundedText),
    [selectedDocs, manualGroundedText]
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setUploadError(null);
      setIsUploading(true);

      try {
        for (const file of Array.from(files)) {
          const textContent = await readGroundedFileAsText(file);
          const docId = await createFromText({
            sessionId,
            name: file.name,
            mimeType: file.type || 'text/plain',
            textContent,
          });
          setSelectedDocIds((prev) => [...prev, docId]);
        }
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    },
    [createFromText, sessionId]
  );

  const savePastedContext = useCallback(async () => {
    const text = manualGroundedText.trim();
    if (!text) return;

    setUploadError(null);
    setIsUploading(true);
    try {
      const docId = await createFromText({
        sessionId,
        name: `pasted-context-${new Date().toISOString().slice(0, 10)}.txt`,
        mimeType: 'text/plain',
        textContent: text,
      });
      setSelectedDocIds((prev) => [...prev, docId]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsUploading(false);
    }
  }, [createFromText, manualGroundedText, sessionId]);

  const deleteDocument = useCallback(
    async (documentId: Id<'groundedDocuments'>) => {
      await removeDocument({ sessionId, documentId });
      setSelectedDocIds((prev) => prev.filter((id) => id !== documentId));
    },
    [removeDocument, sessionId]
  );

  return {
    convexReady: true,
    sessionId,
    documents: documents ?? [],
    isLoading: documents === undefined,
    selectedDocIds,
    setSelectedDocIds,
    manualGroundedText,
    setManualGroundedText,
    effectiveGroundedText,
    selectedDocs,
    uploadFiles,
    savePastedContext,
    deleteDocument,
    uploadError,
    isUploading,
  };
}
