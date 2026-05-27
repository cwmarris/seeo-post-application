import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Save, X, Zap } from 'lucide-react';
import { FOUNDER_PROFILES, type LinkedInPost } from '../utils/mockData';

type ScheduledPostUpdates = { content: string; scheduledTime: string; authorId: string };

interface ScheduledPostModalProps {
  post: LinkedInPost | null;
  onClose: () => void;
  onSave: (id: string, updates: ScheduledPostUpdates) => void;
  onPostNow: (id: string) => void;
}

function toDatetimeLocalValue(isoOrLocal: string) {
  // Accepts ISO string with seconds (2026-05-28T09:00:00) or already-datetime-local.
  // datetime-local expects "YYYY-MM-DDTHH:mm"
  if (!isoOrLocal) return '';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(isoOrLocal)) return isoOrLocal;
  return isoOrLocal.slice(0, 16);
}

export const ScheduledPostModal: React.FC<ScheduledPostModalProps> = ({ post, onClose, onSave, onPostNow }) => {
  const [content, setContent] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [authorId, setAuthorId] = useState<string>(FOUNDER_PROFILES[0]?.id ?? 'craig');

  const profile = useMemo(() => {
    if (!post) return null;
    return FOUNDER_PROFILES.find((p) => p.id === post.authorId) ?? null;
  }, [post]);

  useEffect(() => {
    if (!post) return;
    setContent(post.content);
    setScheduledTime(toDatetimeLocalValue(post.scheduledTime ?? ''));
    setAuthorId(post.authorId);
  }, [post]);

  if (!post) return null;

  const canSave = Boolean(content.trim()) && Boolean(scheduledTime.trim()) && Boolean(authorId.trim());

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onClose}>
      <div
        className="glass-card modal-content"
        role="dialog"
        aria-modal="true"
        aria-label="Scheduled post details"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--color-accent)" /> Scheduled Post
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ID: <span style={{ fontFamily: 'monospace' }}>{post.id}</span>
            </span>
          </div>
          <button className="btn btn-secondary btn-icon" aria-label="Close scheduled post modal" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-meta">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <img
                src={profile?.avatar}
                alt={profile?.name}
                style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: '12px', fontWeight: 800, lineHeight: 1.2 }}>{profile?.name ?? post.authorId}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile?.role ?? 'Scheduled'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <span className="modal-pill">Status: Scheduled</span>
              <span className="modal-pill">Tone: {post.tone}</span>
            </div>
          </div>

          <div className="modal-field">
            <label className="modal-label" htmlFor="scheduled-post-author">
              Author
            </label>
            <select
              id="scheduled-post-author"
              className="text-input-grounded select-input-grounded"
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
            >
              {FOUNDER_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-field">
            <label className="modal-label" htmlFor="scheduled-post-time">
              Scheduled time
            </label>
            <input
              id="scheduled-post-time"
              type="datetime-local"
              className="text-input-grounded"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <label className="modal-label" htmlFor="scheduled-post-content">
              Post content
            </label>
            <textarea
              id="scheduled-post-content"
              className="text-input-grounded"
              style={{ minHeight: '220px', fontSize: '13px', lineHeight: 1.45 }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            onClick={() => {
              onPostNow(post.id);
              onClose();
            }}
          >
            <Zap size={16} />
            Post Now
          </button>

          <div style={{ flex: 1 }} />

          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!canSave}
            onClick={() => {
              onSave(post.id, { content, scheduledTime, authorId });
              onClose();
            }}
          >
            <Save size={16} />
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
};

