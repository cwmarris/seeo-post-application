import { useEffect } from 'react';
import { isConvexConfigured } from '../convex/client';
import { useConvexProviderReady } from '../convex/convexAvailability';
import { useGroundedDocumentsConvex } from '../hooks/useGroundedDocumentsConvex';
import { useGroundedDocumentsLocal } from '../hooks/useGroundedDocumentsLocal';
import type { GroundedDocumentsState } from '../hooks/groundedDocumentsTypes';
import { GroundedDataPanel } from './GroundedDataPanel';

interface GroundedDocumentsBridgeProps {
  onEffectiveGroundedTextChange: (text: string) => void;
}

function GroundedDocumentsPanelInner({
  grounded,
  onEffectiveGroundedTextChange,
}: {
  grounded: GroundedDocumentsState;
  onEffectiveGroundedTextChange: (text: string) => void;
}) {
  useEffect(() => {
    onEffectiveGroundedTextChange(grounded.effectiveGroundedText);
  }, [grounded.effectiveGroundedText, onEffectiveGroundedTextChange]);

  return (
    <GroundedDataPanel
      convexReady={grounded.convexReady}
      documents={grounded.documents}
      isLoading={grounded.isLoading}
      selectedDocIds={grounded.selectedDocIds}
      setSelectedDocIds={grounded.setSelectedDocIds}
      manualGroundedText={grounded.manualGroundedText}
      setManualGroundedText={grounded.setManualGroundedText}
      onUploadFiles={grounded.uploadFiles}
      onSavePastedContext={grounded.savePastedContext}
      onDeleteDocument={grounded.deleteDocument}
      uploadError={grounded.uploadError}
      uploadNotice={grounded.uploadNotice}
      isUploading={grounded.isUploading}
    />
  );
}

function GroundedDocumentsConvex({ onEffectiveGroundedTextChange }: GroundedDocumentsBridgeProps) {
  const grounded = useGroundedDocumentsConvex();
  return (
    <GroundedDocumentsPanelInner
      grounded={grounded}
      onEffectiveGroundedTextChange={onEffectiveGroundedTextChange}
    />
  );
}

function GroundedDocumentsLocal({ onEffectiveGroundedTextChange }: GroundedDocumentsBridgeProps) {
  const grounded = useGroundedDocumentsLocal();
  return (
    <GroundedDocumentsPanelInner
      grounded={grounded}
      onEffectiveGroundedTextChange={onEffectiveGroundedTextChange}
    />
  );
}

function useGroundedDocumentsBackend(): 'convex' | 'local' {
  const providerReady = useConvexProviderReady();
  return isConvexConfigured() && providerReady ? 'convex' : 'local';
}

export function GroundedDocumentsBridge({ onEffectiveGroundedTextChange }: GroundedDocumentsBridgeProps) {
  const backend = useGroundedDocumentsBackend();
  if (backend === 'convex') {
    return <GroundedDocumentsConvex onEffectiveGroundedTextChange={onEffectiveGroundedTextChange} />;
  }
  return <GroundedDocumentsLocal onEffectiveGroundedTextChange={onEffectiveGroundedTextChange} />;
}
