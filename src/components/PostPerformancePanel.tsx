import React from 'react';
import { BarChart3, ExternalLink } from 'lucide-react';
import { FOUNDER_PROFILES, type LinkedInPost } from '../utils/mockData';

interface PostPerformancePanelProps {
  posts: LinkedInPost[];
  onSelectScheduled?: (postId: string) => void;
}

export const PostPerformancePanel: React.FC<PostPerformancePanelProps> = ({
  posts,
  onSelectScheduled,
}) => {
  const trackedPosts = posts.filter(
    (p) => p.status === 'published' || p.status === 'scheduled'
  );
  const publishedCount = trackedPosts.filter((p) => p.status === 'published').length;
  const scheduledCount = trackedPosts.filter((p) => p.status === 'scheduled').length;

  return (
    <div className="glass-card dashboard-panel" style={{ marginTop: '20px' }}>
      <div className="panel-header">
        <h3
          className="panel-title"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <BarChart3 size={18} color="var(--color-accent)" /> Post performance
        </h3>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Workspace activity
        </span>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: '16px' }}>
        <div className="glass-card stat-card" style={{ padding: '12px' }}>
          <span className="stat-value" style={{ fontSize: '18px' }}>
            {publishedCount}
          </span>
          <span className="stat-label">Published posts</span>
        </div>
        <div className="glass-card stat-card" style={{ padding: '12px' }}>
          <span className="stat-value" style={{ fontSize: '18px' }}>
            {scheduledCount}
          </span>
          <span className="stat-label">Scheduled posts</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {trackedPosts.length === 0 ?
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
            Publish or schedule posts to see per-post performance here.
          </p>
        : trackedPosts.map((post) => {
            const profile = FOUNDER_PROFILES.find((p) => p.id === post.authorId);
            return (
              <div
                key={post.id}
                className="glass-card"
                style={{
                  padding: '12px',
                  border: '1px solid rgba(255,255,255,0.04)',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '8px',
                  alignItems: 'start',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <img
                      src={profile?.avatar}
                      alt=""
                      style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>{profile?.name}</span>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background:
                          post.status === 'published' ?
                            'rgba(16,185,129,0.15)'
                          : 'rgba(251,191,36,0.15)',
                      }}
                    >
                      {post.status}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      marginBottom: '8px',
                    }}
                  >
                    {post.content}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                      fontSize: '11px',
                      color: 'var(--text-main)',
                    }}
                  >
                    {post.publishResult ?
                      <span>
                        LinkedIn {post.publishResult.mode === 'live' ? 'live' : post.publishResult.mode.replace('_', ' ')}
                      </span>
                    : <span>Workspace post</span>}
                    {post.scheduledTime && <span>{new Date(post.scheduledTime).toLocaleString()}</span>}
                  </div>
                </div>
                {post.status === 'scheduled' && onSelectScheduled && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: '10px' }}
                    onClick={() => onSelectScheduled(post.id)}
                  >
                    <ExternalLink size={12} style={{ marginRight: '4px' }} />
                    Queue
                  </button>
                )}
              </div>
            );
          })
        }
      </div>
    </div>
  );
};
