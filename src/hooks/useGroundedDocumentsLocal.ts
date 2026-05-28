import { useCallback, useMemo, useState } from 'react';
import type { Id } from '../../convex/_generated/dataModel';
import { buildGroundedTextFromSelection } from '../utils/groundedContext';
import { readGroundedFileAsText } from '../utils/groundedContext';
import type { GroundedDocumentRow } from './groundedDocumentsTypes';

export function useGroundedDocumentsLocal() {
  const [manualGroundedText, setManualGroundedText] = useState('');
  const [documents, setDocuments] = useState<GroundedDocumentRow[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<Id<'groundedDocuments'>[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const selectedDocs = useMemo(() => {
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

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    setUploadError(null);
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const textContent = await readGroundedFileAsText(file);
        const localId = `local-${crypto.randomUUID()}` as Id<'groundedDocuments'>;
        const doc: GroundedDocumentRow = {
          _id: localId,
          name: file.name,
          mimeType: file.type || 'text/plain',
          textContent,
          createdAt: Date.now(),
        };
        setDocuments((prev) => [doc, ...prev]);
        setSelectedDocIds((prev) => [...prev, localId]);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const savePastedContext = useCallback(async () => {
    const text = manualGroundedText.trim();
    if (!text) return;

    setUploadError(null);
    setIsUploading(true);
    try {
      const localId = `local-${crypto.randomUUID()}` as Id<'groundedDocuments'>;
      const doc: GroundedDocumentRow = {
        _id: localId,
        name: `pasted-context-${new Date().toISOString().slice(0, 10)}.txt`,
        mimeType: 'text/plain',
        textContent: text,
        createdAt: Date.now(),
      };
      setDocuments((prev) => [doc, ...prev]);
      setSelectedDocIds((prev) => [...prev, localId]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsUploading(false);
    }
  }, [manualGroundedText]);

  const deleteDocument = useCallback(async (documentId: Id<'groundedDocuments'>) => {
    setDocuments((prev) => prev.filter((d) => d._id !== documentId));
    setSelectedDocIds((prev) => prev.filter((id) => id !== documentId));
  }, []);

  return {
    convexReady: false,
    documents,
    isLoading: false,
    selectedDocIds,
    setSelectedDocIds,
    manualGroundedText,
    setManualGroundedText,
    effectiveGroundedText,
    uploadFiles,
    savePastedContext,
    deleteDocument,
    uploadError,
    isUploading,
  };
}
