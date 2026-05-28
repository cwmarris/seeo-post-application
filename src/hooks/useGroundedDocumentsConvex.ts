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
import type { GroundedDocumentRow } from './groundedDocumentsTypes';

function formatUploadError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;
    if (/fetch|network|websocket|failed to/i.test(msg)) {
      return `${msg} — Check VITE_CONVEX_URL on Vercel matches your Convex cloud deployment and redeploy after changing env vars.`;
    }
    return msg;
  }
  return 'Upload failed';
}

export function useGroundedDocumentsConvex() {
  const [sessionId] = useState(() => getGroundedSessionId());

  const documents = useQuery(api.groundedDocuments.listBySession, { sessionId });
  const createFromText = useMutation(api.groundedDocuments.createFromText);
  const removeDocument = useMutation(api.groundedDocuments.remove);

  const [selectedDocIds, setSelectedDocIds] = useState<Id<'groundedDocuments'>[]>([]);
  const [manualGroundedText, setManualGroundedText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [optimisticDocs, setOptimisticDocs] = useState<GroundedDocumentRow[]>([]);

  const serverDocuments = documents ?? [];

  const mergedDocuments = useMemo(() => {
    const serverIds = new Set(serverDocuments.map((doc) => doc._id));
    const pending = optimisticDocs.filter((doc) => !serverIds.has(doc._id));
    return [...pending, ...serverDocuments];
  }, [optimisticDocs, serverDocuments]);

  const selectedDocs: GroundedDocSelection[] = useMemo(() => {
    return mergedDocuments
      .filter((doc) => selectedDocIds.includes(doc._id))
      .map((doc) => ({
        id: doc._id,
        name: doc.name,
        mimeType: doc.mimeType,
        textContent: doc.textContent,
      }));
  }, [mergedDocuments, selectedDocIds]);

  const effectiveGroundedText = useMemo(
    () => buildGroundedTextFromSelection(selectedDocs, manualGroundedText),
    [selectedDocs, manualGroundedText]
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setUploadError(null);
      setUploadNotice(null);
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
          setOptimisticDocs((prev) => [
            {
              _id: docId,
              name: file.name,
              mimeType: file.type || 'text/plain',
              textContent,
              createdAt: Date.now(),
            },
            ...prev,
          ]);
          setSelectedDocIds((prev) => [...prev, docId]);
        }
        setUploadNotice('File saved to grounded context.');
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[grounded] upload failed', err);
        }
        setUploadError(formatUploadError(err));
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
    setUploadNotice(null);
    setIsUploading(true);
    try {
      const docId = await createFromText({
        sessionId,
        name: `pasted-context-${new Date().toISOString().slice(0, 10)}.txt`,
        mimeType: 'text/plain',
        textContent: text,
      });
      setOptimisticDocs((prev) => [
        {
          _id: docId,
          name: `pasted-context-${new Date().toISOString().slice(0, 10)}.txt`,
          mimeType: 'text/plain',
          textContent: text,
          createdAt: Date.now(),
        },
        ...prev,
      ]);
      setSelectedDocIds((prev) => [...prev, docId]);
      setUploadNotice('Pasted context saved as a document.');
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[grounded] save paste failed', err);
      }
      setUploadError(formatUploadError(err));
    } finally {
      setIsUploading(false);
    }
  }, [createFromText, manualGroundedText, sessionId]);

  const deleteDocument = useCallback(
    async (documentId: Id<'groundedDocuments'>) => {
      await removeDocument({ sessionId, documentId });
      setOptimisticDocs((prev) => prev.filter((doc) => doc._id !== documentId));
      setSelectedDocIds((prev) => prev.filter((id) => id !== documentId));
    },
    [removeDocument, sessionId]
  );

  return {
    convexReady: true,
    sessionId,
    documents: mergedDocuments,
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
    uploadNotice,
    isUploading,
  };
}
