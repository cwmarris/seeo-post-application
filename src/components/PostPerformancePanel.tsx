import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { FOUNDER_PROFILES, type LinkedInPost } from '../utils/mockData';
import {
  syncMetricsForPosts,
  aggregateMetrics,
  type PostPerformanceMetrics,
} from '../utils/postMetrics';

interface PostPerformancePanelProps {
  posts: LinkedInPost[];
  onSelectScheduled?: (postId: string) => void;
}

function TrendIcon({ trend }: { trend: PostPerformanceMetrics['trend'] }) {
  if (trend === 'up') return <TrendingUp size={14} color="var(--color-primary)" />;
  if (trend === 'down') return <TrendingDown size={14} color="#f87171" />;
  return <Minus size={14} color="var(--text-muted)" />;
}

export const PostPerformancePanel: React.FC<PostPerformancePanelProps> = ({
  posts,
  onSelectScheduled,
}) => {
  const metrics = useMemo(() => syncMetricsForPosts(posts), [posts]);
  const summary = useMemo(() => aggregateMetrics(metrics), [metrics]);

  const trackedPosts = posts.filter(
    (p) => p.status === 'published' || p.status === 'scheduled'
  );

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
          Mock metrics · LinkedIn API not connected
        </span>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: '16px' }}>
        <div className="glass-card stat-card" style={{ padding: '12px' }}>
          <span className="stat-value" style={{ fontSize: '18px' }}>
            {summary.totalImpressions.toLocaleString()}
          </span>
          <span className="stat-label">Total impressions (simulated)</span>
        </div>
        <div className="glass-card stat-card" style={{ padding: '12px' }}>
          <span className="stat-value" style={{ fontSize: '18px' }}>
            {summary.averageEngagement}
          </span>
          <span className="stat-label">Avg. engagement rate</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {trackedPosts.length === 0 ?
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
            Publish or schedule posts to see per-post performance here.
          </p>
        : trackedPosts.map((post) => {
            const m = metrics.find((x) => x.postId === post.id);
            const profile = FOUNDER_PROFILES.find((p) => p.id === post.authorId);
            if (!m) return null;
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
                    <TrendIcon trend={m.trend} />
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
                    <span>{m.impressions.toLocaleString()} impr.</span>
                    <span>{m.engagementRate}% eng.</span>
                    <span>{m.reactions} reactions</span>
                    <span>{m.comments} comments</span>
                    <span>{m.shares} shares</span>
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
