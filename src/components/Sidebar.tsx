import React from 'react';
import { LayoutDashboard, PenTool, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import type { SidebarTelemetry } from '../utils/sidebarTelemetry';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  telemetry: SidebarTelemetry;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, telemetry }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard & Feed', icon: LayoutDashboard },
    { id: 'composer', label: 'Post Composer', icon: PenTool },
    { id: 'scheduler', label: 'Queue & Scheduler', icon: Calendar },
    { id: 'optimizer', label: 'RL Engine & Tuning', icon: TrendingUp },
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand area */}
      <div className="sidebar-brand">
        <div className="brand-text" aria-label="seeo trademark KNOW">
          seeo<sup className="brand-tm">TM</sup>
          <span>K N O W</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer — live telemetry from RL state, experiments, health, posts */}
      <div className="sidebar-footer">
        <div className="user-status">
          <div
            className="status-dot"
            style={{
              background: telemetry.openaiConfigured ? 'var(--color-primary)' : 'var(--color-warning)',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AI Telemetry</span>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>{telemetry.openaiStatusLabel}</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '12px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
            <Sparkles size={14} />
            <span>RL LEARNING INDEX</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '20px', fontFamily: 'var(--font-display)', fontWeight: 800 }}>{telemetry.rlLearningIndex}%</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{telemetry.rewardHint}</span>
          </div>
          <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {telemetry.experimentCount} improve experiment{telemetry.experimentCount === 1 ? '' : 's'} ·{' '}
            {telemetry.scheduledCount} scheduled · {telemetry.publishedCount} published
          </div>
        </div>
      </div>
    </aside>
  );
};
