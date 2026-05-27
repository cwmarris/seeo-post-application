import React from 'react';
import { Sparkles, Calendar, Award, Zap } from 'lucide-react';
import { type LinkedInPost, FOUNDER_PROFILES } from '../utils/mockData';
import { LinkedInPreview } from './LinkedInPreview';

interface DashboardViewProps {
  posts: LinkedInPost[];
  rlScore: number;
  averageRating: number;
  totalRated: number;
  handlePostNow: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  posts,
  rlScore,
  averageRating,
  totalRated,
  handlePostNow
}) => {
  const publishedPosts = posts.filter((p) => p.status === 'published');
  const scheduledPosts = posts.filter((p) => p.status === 'scheduled');

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

      {/* 2. Main Layout (Mock Feed vs Scheduler Queue) */}
      <div className="dashboard-layout">
        {/* Left Side: Mock LinkedIn Feed */}
        <div className="glass-card dashboard-panel">
          <div className="panel-header">
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="var(--color-primary)" /> seeo KNOW Live Feed
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Simulated LinkedIn Sandbox</span>
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
                No published posts yet. Complete a draft in the Composer to publish immediately!
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
                  <div key={post.id} className="glass-card" style={{ padding: '14px', border: '1px solid rgba(255,255,255,0.03)' }}>
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
                        onClick={() => handlePostNow(post.id)}
                      >
                        Post Now
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '11px' }}
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
    </div>
  );
};
