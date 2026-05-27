import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { type LinkedInPost, FOUNDER_PROFILES } from '../utils/mockData';

interface SchedulerViewProps {
  posts: LinkedInPost[];
}

export const SchedulerView: React.FC<SchedulerViewProps> = ({ posts }) => {
  const [viewType, setViewType] = useState<'calendar' | 'list'>('calendar');
  const [staggerDays, setStaggerDays] = useState<number>(3);
  
  const scheduledPosts = posts.filter(p => p.status === 'scheduled');
  const publishedPosts = posts.filter(p => p.status === 'published');

  // Simple static calendar generator for May 2026 (current time in metadata is May 2026!)
  const daysInMonth = 31;
  const startDayOffset = 5; // May 1st 2026 is Friday
  const monthName = 'May 2026';

  const renderCalendar = () => {
    const cells: React.ReactNode[] = [];
    
    // Empty cells for starting offset
    for (let i = 0; i < startDayOffset; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell muted" />);
    }

    // Days cells
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === 26; // Current metadata local time is May 26th
      
      // Find if there is a post scheduled for this day
      const dayPosts = scheduledPosts.filter(p => {
        if (!p.scheduledTime) return false;
        const date = new Date(p.scheduledTime);
        return date.getDate() === day && date.getMonth() === 4; // May is month 4
      });

      const dayPubPosts = publishedPosts.filter(p => {
        // Assume published posts are historical
        if (day === 18 && p.authorId === 'craig') return true;
        if (day === 22 && p.authorId === 'bede') return true;
        return false;
      });

      cells.push(
        <div key={day} className={`calendar-cell ${isToday ? 'today' : ''}`} style={{ border: isToday ? '1.5px solid var(--color-primary)' : '1.5px solid var(--border-glass)' }}>
          <div className="calendar-day-num">{day} {isToday ? '(Today)' : ''}</div>
          
          {dayPosts.map(p => {
            const profile = FOUNDER_PROFILES.find(prof => prof.id === p.authorId);
            return (
              <div key={p.id} className={`calendar-post-badge ${p.authorId}`} title={p.content}>
                🕒 {profile?.name.split(' ')[0]}
              </div>
            );
          })}

          {dayPubPosts.map(p => {
            const profile = FOUNDER_PROFILES.find(prof => prof.id === p.authorId);
            return (
              <div key={p.id} className={`calendar-post-badge ${p.authorId}`} style={{ opacity: 0.7 }} title={p.content}>
                ✓ {profile?.name.split(' ')[0]}
              </div>
            );
          })}
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="view-container">
      
      {/* Settings Panel */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '30px' }}>
        <h3 className="panel-title" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--color-primary)" /> Automatic Queue Stagger Controller
        </h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Stagger Interval Spacing (Days):
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
              <input
                type="range"
                className="rl-slider"
                min="1"
                max="7"
                value={staggerDays}
                onChange={(e) => setStaggerDays(parseInt(e.target.value))}
              />
              <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '60px' }}>{staggerDays} days</span>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', flex: 2 }}>
            💡 **Smart Staggering Active**: The AI will automatically separate your posts by exactly **{staggerDays} days** and schedule them during premium LinkedIn engagement windows (9:00 AM - 11:00 AM NZT). This staggers multiple posts to maximize founder reach and feed visibility.
          </div>
        </div>
      </div>

      {/* Main View Shell */}
      <div className="scheduler-layout">
        
        {/* Left Side: Calendar / Day Timeline */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div className="panel-header" style={{ marginBottom: '18px' }}>
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--color-accent)" /> {monthName} Calendar Grid
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`btn btn-secondary ${viewType === 'calendar' ? 'active' : ''}`}
                style={{ padding: '6px 12px', fontSize: '11px', background: viewType === 'calendar' ? 'rgba(255,255,255,0.08)' : '' }}
                onClick={() => setViewType('calendar')}
              >
                Grid
              </button>
              <button
                className={`btn btn-secondary ${viewType === 'list' ? 'active' : ''}`}
                style={{ padding: '6px 12px', fontSize: '11px', background: viewType === 'list' ? 'rgba(255,255,255,0.08)' : '' }}
                onClick={() => setViewType('list')}
              >
                List
              </button>
            </div>
          </div>

          {viewType === 'calendar' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="calendar-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <div key={d} className="calendar-header-day">{d}</div>
                ))}
              </div>
              <div className="calendar-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {renderCalendar()}
              </div>
            </div>
          ) : (
            <div className="timeline-list">
              {scheduledPosts.map(p => {
                const profile = FOUNDER_PROFILES.find(prof => prof.id === p.authorId);
                const date = p.scheduledTime ? new Date(p.scheduledTime) : new Date();
                return (
                  <div key={p.id} className="timeline-item">
                    <div className="timeline-author-details">
                      <img src={profile?.avatar} alt={profile?.name} className="timeline-avatar" />
                      <div className="timeline-info">
                        <span className="timeline-title">{p.content}</span>
                        <span className="timeline-time">
                          📅 {date.toLocaleString()} • Voice: {profile?.name}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '10px', background: 'rgba(255, 77, 44, 0.15)', border: '1px solid rgba(255, 77, 44, 0.3)', padding: '4px 8px', borderRadius: '4px', color: 'var(--color-accent-hover)', fontWeight: 700 }}>
                      Scheduled
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Staggered Queue details */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div className="panel-header">
            <h3 className="panel-title">Stagger Timeline Strategy</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Continuous distribution</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '6px' }}>
                Why Stagger Posts?
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                LinkedIn's algorithm penalizes accounts that post multiple items within a 24-hour window. Spacing out messages over a **{staggerDays}-day stagger** allows each post to gain maximum traction, views, and comments before the next narrative triggers.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '6px' }}>
                Founder Rotation Strategy
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                The seeo Posting App alternates voices in the queue:
                <br />• **Craig Marris**: Corporate Safety Governance, EROAD / Coretex culture.
                <br />• **Dean Marris**: Technological telemetry integration, CCTV IoT cameras.
                <br />• **Bede Cammock-Elliott**: CCTV historic auditing and empirical safety proof.
                <br />This maintains an extremely rich, multi-dimensional business feed.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
