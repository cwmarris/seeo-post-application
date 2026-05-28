import React, { useMemo, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PostComposerView } from './components/PostComposerView';
import { SchedulerView } from './components/SchedulerView';
import { RLOptimizerView } from './components/RLOptimizerView';
import { HealthStatusBadge } from './components/HealthStatusBadge';
import { INITIAL_POSTS, type LinkedInPost } from './utils/mockData';
import { getRLState, type RLState } from './utils/rlEngine';
import { buildSidebarTelemetry, computeRlLearningIndex } from './utils/sidebarTelemetry';
import { useOpenAIHealth } from './hooks/useOpenAIHealth';
import './styles/theme.css';
import './styles/App.css';
import './styles/components.css';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [posts, setPosts] = useState<LinkedInPost[]>(INITIAL_POSTS);
  const [rlState, setRlState] = useState<RLState>(getRLState());
  const [telemetryTick, setTelemetryTick] = useState(0);
  const { openai: openaiHealth, loading: openaiHealthLoading } = useOpenAIHealth();
  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;
  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const rlLearningIndex = computeRlLearningIndex(rlState);

  const sidebarTelemetry = useMemo(
    () =>
      buildSidebarTelemetry({
        rlState,
        openaiConfigured: openaiHealth?.configured ?? false,
        openaiLoading: openaiHealthLoading,
        scheduledCount,
        publishedCount,
      }),
    [rlState, openaiHealth?.configured, openaiHealthLoading, scheduledCount, publishedCount, telemetryTick]
  );

  const handleAddPost = (newPost: LinkedInPost) => {
    setPosts([newPost, ...posts]);
    setActiveTab('dashboard'); // Switch to feed after adding
  };

  const handleUpdateScheduledPost = (postId: string, updates: { content: string; scheduledTime: string; authorId: string }) => {
    setPosts(
      posts.map((p) => {
        if (p.id !== postId) return p;
        if (p.status !== 'scheduled') return p;
        return { ...p, content: updates.content, scheduledTime: updates.scheduledTime, authorId: updates.authorId };
      })
    );
  };

  const handlePostNow = (postId: string) => {
    setPosts(
      posts.map((p) => {
        if (p.id === postId) {
          return { ...p, status: 'published', likes: 12, comments: 2, shares: 1 };
        }
        return p;
      })
    );
  };

  const updateRlState = (newState: RLState) => {
    setRlState(newState);
    setTelemetryTick((t) => t + 1);
  };

  // Dynamic Page Header Metadata
  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Analytics Dashboard',
          subtitle: 'Active social queue and live LinkedIn feed simulations.'
        };
      case 'composer':
        return {
          title: 'STEEP AI Post Composer',
          subtitle: 'Create rich grounded drafts tailored to your business foresight.'
        };
      case 'scheduler':
        return {
          title: 'Stagger Queue & Calendar',
          subtitle: 'Organize and stagger founder rotation timelines seamlessly.'
        };
      case 'optimizer':
        return {
          title: 'RL Optimizations & Synonym Tuning',
          subtitle: 'Observe weight adapters and manage locked-out phrase lists.'
        };
      default:
        return {
          title: 'seeo Posting App',
          subtitle: 'Strategic LinkedIn content engine.'
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="app-container">
      {/* 1. Collapsible Premium Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        telemetry={sidebarTelemetry}
      />

      {/* 2. Main Content Area */}
      <main className="app-content">
        
        {/* Dynamic Section Header */}
        <header className="content-header">
          <div className="header-title-area">
            <h1 className="header-title">{headerInfo.title}</h1>
            <span className="header-subtitle">{headerInfo.subtitle}</span>
          </div>
          
          <div className="header-actions">
            <HealthStatusBadge label="seeo Post Application" />
          </div>
        </header>

        {/* 3. Render Active Tab View Panel */}
        {activeTab === 'dashboard' && (
          <DashboardView
            posts={posts}
            rlScore={rlLearningIndex}
            averageRating={rlState.averageRating}
            totalRated={rlState.postCountRated}
            handlePostNow={handlePostNow}
            handleUpdateScheduledPost={handleUpdateScheduledPost}
            onGoToScheduler={() => setActiveTab('scheduler')}
          />
        )}

        {activeTab === 'composer' && (
          <PostComposerView
            onAddPost={handleAddPost}
            rlState={rlState}
            updateRlState={updateRlState}
            onTelemetryRefresh={() => setTelemetryTick((t) => t + 1)}
          />
        )}

        {activeTab === 'scheduler' && (
          <SchedulerView posts={posts} />
        )}

        {activeTab === 'optimizer' && (
          <RLOptimizerView
            rlState={rlState}
            updateRlState={updateRlState}
          />
        )}
      </main>
    </div>
  );
};

export default App;
