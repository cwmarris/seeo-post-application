import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PostComposerView } from './components/PostComposerView';
import { SchedulerView } from './components/SchedulerView';
import { RLOptimizerView } from './components/RLOptimizerView';
import { INITIAL_POSTS, type LinkedInPost } from './utils/mockData';
import { getRLState, type RLState } from './utils/rlEngine';
import './styles/theme.css';
import './styles/App.css';
import './styles/components.css';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [posts, setPosts] = useState<LinkedInPost[]>(INITIAL_POSTS);
  const [rlState, setRlState] = useState<RLState>(getRLState());

  const handleAddPost = (newPost: LinkedInPost) => {
    setPosts([newPost, ...posts]);
    setActiveTab('dashboard'); // Switch to feed after adding
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
        rlScore={rlState.steepWeights.Technological} // Use Technology factor as a live dynamic index
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
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', border: '1px solid var(--border-glass)', borderRadius: '20px', fontSize: '12px' }}>
              <span className="status-dot"></span>
              <span style={{ fontWeight: 600 }}>Christchurch Hub Connected</span>
            </div>
          </div>
        </header>

        {/* 3. Render Active Tab View Panel */}
        {activeTab === 'dashboard' && (
          <DashboardView
            posts={posts}
            rlScore={rlState.steepWeights.Technological}
            averageRating={rlState.averageRating}
            totalRated={rlState.postCountRated}
            handlePostNow={handlePostNow}
            onGoToScheduler={() => setActiveTab('scheduler')}
          />
        )}

        {activeTab === 'composer' && (
          <PostComposerView
            onAddPost={handleAddPost}
            rlState={rlState}
            updateRlState={updateRlState}
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
