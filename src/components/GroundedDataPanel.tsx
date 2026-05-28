import React, { useId, useRef, useState } from 'react';
import { Upload, FileText, Trash2, Loader2 } from 'lucide-react';
import type { Id } from '../../convex/_generated/dataModel';
import { getConvexDisplayHost } from '../convex/client';
import type { GroundedDocumentRow } from '../hooks/groundedDocumentsTypes';

interface GroundedDataPanelProps {
  convexReady: boolean;
  documents: GroundedDocumentRow[];
  isLoading: boolean;
  selectedDocIds: Id<'groundedDocuments'>[];
  setSelectedDocIds: React.Dispatch<React.SetStateAction<Id<'groundedDocuments'>[]>>;
  manualGroundedText: string;
  setManualGroundedText: (text: string) => void;
  onUploadFiles: (files: FileList | File[]) => Promise<void>;
  onSavePastedContext: () => Promise<void>;
  onDeleteDocument: (documentId: Id<'groundedDocuments'>) => Promise<void>;
  uploadError: string | null;
  uploadNotice: string | null;
  isUploading: boolean;
}

export const GroundedDataPanel: React.FC<GroundedDataPanelProps> = ({
  convexReady,
  documents,
  isLoading,
  selectedDocIds,
  setSelectedDocIds,
  manualGroundedText,
  setManualGroundedText,
  onUploadFiles,
  onSavePastedContext,
  onDeleteDocument,
  uploadError,
  uploadNotice,
  isUploading,
}) => {
  const [isDndActive, setIsDndActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();
  const convexHost = getConvexDisplayHost();

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    void onUploadFiles(files);
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDndActive(true);
  };

  const handleDragLeave = () => {
    setIsDndActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDndActive(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="glass-card grounded-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="var(--color-primary)" /> Grounded Context & Files
        </h3>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {convexReady ?
            convexHost ? `Convex · ${convexHost}`
            : 'Convex-backed'
          : 'Session-only (no Convex URL)'}
        </span>
      </div>

      {!convexReady && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Uploads work in this browser tab only until you set <code>VITE_CONVEX_URL</code> to your{' '}
          <code>*.convex.cloud</code> deployment and <strong>redeploy</strong> on Vercel (env vars are baked in at
          build time).
        </p>
      )}

      <input
        id={fileInputId}
        ref={fileInputRef}
        type="file"
        accept=".txt,.csv,text/plain,text/csv,application/csv,text/comma-separated-values"
        multiple
        style={{ display: 'none' }}
        aria-label="Upload grounded context files"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <div
        className={`dnd-area ${isDndActive ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFilePicker}
        role="button"
        tabIndex={0}
        aria-label="Open grounded context file picker"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openFilePicker();
          }
        }}
      >
        {isUploading ?
          <Loader2 className="dnd-icon" style={{ animation: 'spin 1s linear infinite' }} />
        : <Upload className="dnd-icon" />}
        <div style={{ fontSize: '13px', fontWeight: 600 }}>
          {isUploading ? 'Uploading…' : 'Drag SOPs, logs, or reports here'}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          TXT and CSV up to 512KB (PDF coming later)
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '12px' }}
          disabled={isUploading}
          onClick={openFilePicker}
        >
          Upload file
        </button>
        <label
          htmlFor={fileInputId}
          className="btn-secondary"
          style={{ fontSize: '12px', cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.6 : 1 }}
          aria-disabled={isUploading}
        >
          Choose file…
        </label>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center' }}>
          .txt and .csv only (max 512KB)
        </span>
      </div>

      {uploadError && (
        <div
          role="alert"
          style={{
            marginTop: '10px',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(248, 113, 113, 0.45)',
            background: 'rgba(127, 29, 29, 0.35)',
            color: '#fecaca',
            fontSize: '12px',
            lineHeight: 1.45,
          }}
        >
          <strong style={{ display: 'block', marginBottom: '4px' }}>Upload failed</strong>
          {uploadError}
        </div>
      )}

      {uploadNotice && !uploadError && (
        <div
          role="status"
          style={{
            marginTop: '10px',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            background: 'rgba(6, 78, 59, 0.25)',
            color: '#a7f3d0',
            fontSize: '12px',
          }}
        >
          {uploadNotice}
        </div>
      )}

      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
          Saved documents {isLoading ? '(loading…)' : `(${documents.length})`}
        </div>
        {documents.length === 0 && !isLoading ?
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No saved documents yet.</p>
        : <div className="file-list">
            {documents.map((doc) => {
              const isSelected = selectedDocIds.includes(doc._id);
              return (
                <div
                  key={doc._id}
                  className={`file-tag active ${isSelected ? '' : 'inactive'}`}
                  style={{
                    cursor: 'pointer',
                    opacity: isSelected ? 1 : 0.65,
                    border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-glass)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDocIds((prev) =>
                        prev.includes(doc._id) ?
                          prev.filter((id) => id !== doc._id)
                        : [...prev, doc._id]
                      )
                    }
                    style={{
                      all: 'unset',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flex: 1,
                      cursor: 'pointer',
                    }}
                  >
                    <FileText size={12} />
                    <span>{doc.name}</span>
                    {isSelected && (
                      <span style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 800 }}>✓</span>
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${doc.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      void onDeleteDocument(doc._id);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        }
      </div>

      <div style={{ marginTop: '16px' }}>
        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
          Direct Grounded Context Editor
        </label>
        <textarea
          className="text-input-grounded"
          placeholder="Paste incident details, audit notes, or director statements. Selected saved docs are merged into draft generation."
          value={manualGroundedText}
          onChange={(e) => setManualGroundedText(e.target.value)}
        />
        {convexReady && manualGroundedText.trim() && (
          <button
            type="button"
            className="btn-secondary"
            style={{ marginTop: '8px', fontSize: '12px' }}
            disabled={isUploading}
            onClick={() => void onSavePastedContext()}
          >
            Save paste as document
          </button>
        )}
      </div>
    </div>
  );
};
