import type { Dispatch, SetStateAction } from 'react';
import type { Id } from '../../convex/_generated/dataModel';

export interface GroundedDocumentRow {
  _id: Id<'groundedDocuments'>;
  name: string;
  mimeType: string;
  textContent: string;
  createdAt: number;
}

export interface GroundedDocumentsState {
  convexReady: boolean;
  documents: GroundedDocumentRow[];
  isLoading: boolean;
  selectedDocIds: Id<'groundedDocuments'>[];
  setSelectedDocIds: Dispatch<SetStateAction<Id<'groundedDocuments'>[]>>;
  manualGroundedText: string;
  setManualGroundedText: (text: string) => void;
  effectiveGroundedText: string;
  uploadFiles: (files: FileList | File[]) => Promise<void>;
  savePastedContext: () => Promise<void>;
  deleteDocument: (documentId: Id<'groundedDocuments'>) => Promise<void>;
  uploadError: string | null;
  isUploading: boolean;
}
