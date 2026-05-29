import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, ExternalLink, RefreshCw } from 'lucide-react';
import { FOUNDER_PROFILES, type LinkedInPost } from '../utils/mockData';
import {
  fetchLinkedInMetrics,
  type LinkedInMetricsResponse,
  type LinkedInTrackedPost,
} from '../utils/linkedinApi';

interface PostPerformancePanelProps {
  posts: LinkedInPost[];
  onSelectScheduled?: (postId: string) => void;
}

export const PostPerformancePanel: React.FC<PostPerformancePanelProps> = ({
  posts,
  onSelectScheduled,
}) => {
  const [linkedInMetrics, setLinkedInMetrics] = useState<LinkedInMetricsResponse | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const trackedPosts = posts.filter(
    (p) => p.status === 'published' || p.status === 'scheduled'
  );
  const publishedCount = trackedPosts.filter((p) => p.status === 'published').length;
  const scheduledCount = trackedPosts.filter((p) => p.status === 'scheduled').length;
  const liveTrackedPosts = useMemo(
    () => linkedInMetrics?.trackedPosts ?? [],
    [linkedInMetrics]
  );
  const metricsSummary = useMemo(
    () =>
      liveTrackedPosts.reduce(
        (summary, row) => {
          if (!row.metrics || row.metrics.syncStatus !== 'synced') return summary;
          summary.impressions += row.metrics.impressions;
          summary.reactions += row.metrics.reactions;
          summary.comments += row.metrics.comments;
          summary.reshares += row.metrics.reshares;
          return summary;
        },
        { impressions: 0, reactions: 0, comments: 0, reshares: 0 }
      ),
    [liveTrackedPosts]
  );

  const loadLinkedInMetrics = useCallback(async (sync = false) => {
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      const result = await fetchLinkedInMetrics({ sync });
      setLinkedInMetrics(result);
      if (result.syncError) setMetricsError(result.syncError);
    } catch (err) {
      setMetricsError(err instanceof Error ? err.message : 'LinkedIn metrics failed');
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchLinkedInMetrics({ sync: false })
      .then((result) => {
        if (cancelled) return;
        setLinkedInMetrics(result);
        setMetricsError(result.syncError ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setMetricsError(err instanceof Error ? err.message : 'LinkedIn metrics failed');
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
          Real LinkedIn metrics
        </span>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: '16px' }}>
        <div className="glass-card stat-card" style={{ padding: '12px' }}>
          <span className="stat-value" style={{ fontSize: '18px' }}>
            {metricsSummary.impressions.toLocaleString()}
          </span>
          <span className="stat-label">Impressions</span>
        </div>
        <div className="glass-card stat-card" style={{ padding: '12px' }}>
          <span className="stat-value" style={{ fontSize: '18px' }}>
            {metricsSummary.reactions.toLocaleString()}
          </span>
          <span className="stat-label">Reactions</span>
        </div>
        <div className="glass-card stat-card" style={{ padding: '12px' }}>
          <span className="stat-value" style={{ fontSize: '18px' }}>
            {metricsSummary.comments.toLocaleString()}
          </span>
          <span className="stat-label">Comments</span>
        </div>
        <div className="glass-card stat-card" style={{ padding: '12px' }}>
          <span className="stat-value" style={{ fontSize: '18px' }}>
            {metricsSummary.reshares.toLocaleString()}
          </span>
          <span className="stat-label">Reposts</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '8px 12px', fontSize: '11px', display: 'flex', gap: '6px', alignItems: 'center' }}
          disabled={metricsLoading}
          onClick={() => void loadLinkedInMetrics(true)}
        >
          <RefreshCw size={13} style={metricsLoading ? { animation: 'spin 1s linear infinite' } : undefined} />
          {metricsLoading ? 'Syncing…' : 'Refresh metrics'}
        </button>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {liveTrackedPosts.length} live LinkedIn post{liveTrackedPosts.length === 1 ? '' : 's'} tracked · {publishedCount} workspace published · {scheduledCount} scheduled
        </span>
      </div>

      {metricsError && (
        <div
          role="status"
          style={{
            fontSize: '12px',
            color: 'var(--color-warning)',
            padding: '8px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(251, 191, 36, 0.25)',
            background: 'rgba(251, 191, 36, 0.06)',
            marginBottom: '12px',
          }}
        >
          {metricsError}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {liveTrackedPosts.length > 0 && liveTrackedPosts.map((row) => (
          <LinkedInMetricsRow key={row.post.postUrn} row={row} />
        ))}

        {trackedPosts.length === 0 && liveTrackedPosts.length === 0 ?
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
            Publish a live post, then refresh metrics to see impressions and engagement.
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

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

function LinkedInMetricsRow({ row }: { row: LinkedInTrackedPost }) {
  const metrics = row.metrics;
  return (
    <div
      className="glass-card"
      style={{
        padding: '12px',
        border: '1px solid rgba(16,185,129,0.14)',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '8px',
        alignItems: 'start',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 700 }}>LinkedIn live post</span>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(16,185,129,0.15)',
            }}
          >
            live
          </span>
          {metrics?.syncedAt && (
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              synced {new Date(metrics.syncedAt).toLocaleString()}
            </span>
          )}
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
          {row.post.commentary}
        </p>
        {metrics && metrics.syncStatus === 'synced' ?
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              fontSize: '11px',
              color: 'var(--text-main)',
            }}
          >
            <span>{metrics.impressions.toLocaleString()} impressions</span>
            {metrics.membersReached !== undefined && <span>{metrics.membersReached.toLocaleString()} reached</span>}
            <span>{metrics.reactions.toLocaleString()} reactions</span>
            <span>{metrics.comments.toLocaleString()} comments</span>
            <span>{metrics.reshares.toLocaleString()} reposts</span>
            <span>{formatRate(metrics.engagementRate)} engagement</span>
          </div>
        : <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {metrics?.error ?? 'Metrics not synced yet.'}
          </div>
        }
      </div>
      {row.post.previewUrl && (
        <a
          className="btn btn-secondary"
          style={{ padding: '6px 10px', fontSize: '10px', textDecoration: 'none' }}
          href={row.post.previewUrl}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink size={12} style={{ marginRight: '4px' }} />
          Open
        </a>
      )}
    </div>
  );
}
