import React, { useMemo, useState } from 'react';
import { Sparkles, Calendar, Award, Zap } from 'lucide-react';
import { type LinkedInPost, FOUNDER_PROFILES } from '../utils/mockData';
import { LinkedInPreview } from './LinkedInPreview';
import { PostPerformancePanel } from './PostPerformancePanel';
import { ScheduledPostModal } from './ScheduledPostModal';

interface DashboardViewProps {
  posts: LinkedInPost[];
  rlScore: number;
  averageRating: number;
  totalRated: number;
  handlePostNow: (id: string) => void;
  handleUpdateScheduledPost: (id: string, updates: { content: string; scheduledTime: string; authorId: string }) => void;
  onGoToScheduler?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  posts,
  rlScore,
  averageRating,
  totalRated,
  handlePostNow,
  handleUpdateScheduledPost,
  onGoToScheduler
}) => {
  const publishedPosts = posts.filter((p) => p.status === 'published');
  const scheduledPosts = posts.filter((p) => p.status === 'scheduled');
  const latestPublishResult = posts.find((p) => p.publishResult)?.publishResult;
  const latestLivePreviewUrl =
    latestPublishResult?.mode === 'live' ? latestPublishResult.previewUrl : undefined;
  const scheduledById = useMemo(() => new Map(scheduledPosts.map((p) => [p.id, p])), [scheduledPosts]);
  const [activeScheduledId, setActiveScheduledId] = useState<string | null>(null);
  const activeScheduledPost = activeScheduledId ? scheduledById.get(activeScheduledId) ?? null : null;

  // Compute stat counters
  const totalLikes = publishedPosts.reduce((acc, p) => acc + (p.likes || 0), 0);
  const totalComments = publishedPosts.reduce((acc, p) => acc + (p.comments || 0), 0);

  return (
    <div className="view-container">
      {/* 1. Analytics Cards */}
      <div className="dashboard-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper green">
            <Sparkles size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{rlScore}%</span>
            <span className="stat-label">RL Alignment Index</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper orange">
            <Award size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{averageRating} ★</span>
            <span className="stat-label">Avg. Post Rating ({totalRated} rated)</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper blue">
            <Calendar size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{scheduledPosts.length}</span>
            <span className="stat-label">Scheduled Posts</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper purple">
            <Zap size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalLikes + totalComments}</span>
            <span className="stat-label">Social Engagements</span>
          </div>
        </div>
      </div>

      {latestPublishResult && (
        <div
          className="glass-card"
          role="status"
          style={{
            marginBottom: '18px',
            padding: '14px 16px',
            border: '1px solid rgba(16, 185, 129, 0.28)',
            background: 'rgba(16, 185, 129, 0.08)',
            color: 'var(--text-main)',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '4px' }}>
            LinkedIn {latestPublishResult.mode === 'live' ? 'post created' : 'test succeeded'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            {latestPublishResult.message}
            {latestPublishResult.mode === 'dry_run' ?
              ' No live LinkedIn post was created, so there is no LinkedIn preview to open.'
            : ''}
            {latestPublishResult.mode === 'mock' ?
              ' Mock mode skips LinkedIn, so there is no LinkedIn preview to open.'
            : ''}
            {latestLivePreviewUrl && (
              <>
                {' '}
                <a
                  href={latestLivePreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--color-primary)', fontWeight: 700 }}
                >
                  Open on LinkedIn
                </a>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. Main Layout (Mock Feed vs Scheduler Queue) */}
      <div className="dashboard-layout">
        {/* Left Side: Mock LinkedIn Feed */}
        <div className="glass-card dashboard-panel">
          <div className="panel-header">
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="var(--color-primary)" /> LinkedIn Feed
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Posts from this workspace</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '700px', overflowY: 'auto', paddingRight: '8px' }}>
            {publishedPosts.length > 0 ? (
              publishedPosts.map((post) => (
                <LinkedInPreview
                  key={post.id}
                  authorId={post.authorId}
                  content={post.content}
                  image={post.image}
                  timestamp="Published"
                />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No published posts yet. Create a draft in the Composer when you are ready.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Quick Queue Schedule & Action items */}
        <div className="glass-card dashboard-panel">
          <div className="panel-header">
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--color-accent)" /> Stagger Queue
            </h3>
            <span className="stat-label">Next to publish</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {scheduledPosts.length > 0 ? (
              scheduledPosts.map((post) => {
                const profile = FOUNDER_PROFILES.find((p) => p.id === post.authorId);
                const date = post.scheduledTime ? new Date(post.scheduledTime) : new Date();
                return (
                  <div
                    key={post.id}
                    className="glass-card interactive queue-card"
                    role="button"
                    tabIndex={0}
                    aria-label={`Open scheduled post ${post.id}`}
                    onClick={() => setActiveScheduledId(post.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setActiveScheduledId(post.id);
                    }}
                    style={{ padding: '14px', border: '1px solid rgba(255,255,255,0.03)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <img
                        src={profile?.avatar}
                        alt={profile?.name}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>{profile?.name}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {date.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '10px', lineHeight: 1.4 }}>
                      {post.content}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '11px', flex: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePostNow(post.id);
                        }}
                      >
                        Post Now
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveScheduledId(post.id);
                        }}
                      >
                        Reschedule
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                All scheduled items have published! Stagger more posts in the Composer.
              </div>
            )}
          </div>
        </div>
      </div>

      <ScheduledPostModal
        post={activeScheduledPost}
        onClose={() => setActiveScheduledId(null)}
        onPostNow={(id) => handlePostNow(id)}
        onSave={(id, updates) => handleUpdateScheduledPost(id, updates)}
      />

      <PostPerformancePanel
        posts={posts}
        onSelectScheduled={onGoToScheduler ? () => onGoToScheduler() : undefined}
      />
    </div>
  );
};
