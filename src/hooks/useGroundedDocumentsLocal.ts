import { useMemo, useState } from 'react';
import type { Id } from '../../convex/_generated/dataModel';
import { buildGroundedTextFromSelection } from '../utils/groundedContext';

export function useGroundedDocumentsLocal() {
  const [manualGroundedText, setManualGroundedText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(
    'Convex is not configured. Set VITE_CONVEX_URL and run npx convex dev to persist uploads.'
  );

  const effectiveGroundedText = useMemo(
    () => buildGroundedTextFromSelection([], manualGroundedText),
    [manualGroundedText]
  );

  return {
    convexReady: false,
    documents: [],
    isLoading: false,
    selectedDocIds: [] as Id<'groundedDocuments'>[],
    setSelectedDocIds: () => undefined,
    manualGroundedText,
    setManualGroundedText,
    effectiveGroundedText,
    uploadFiles: async () => {
      setUploadError(
        'Convex is not configured. Set VITE_CONVEX_URL and run npx convex dev to persist uploads.'
      );
    },
    savePastedContext: async () => undefined,
    deleteDocument: async () => undefined,
    uploadError,
    isUploading: false,
  };
}
