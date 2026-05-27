import React, { useMemo, useState } from 'react';
import { Sparkles, Calendar, Send, ShieldAlert, Award, FlaskConical, RefreshCw } from 'lucide-react';
import { FOUNDER_PROFILES, type LinkedInPost } from '../utils/mockData';
import { type RLState, ratePostAndAdapt } from '../utils/rlEngine';
import {
  runImproveDraftIteration,
  isAutoImproveEnabled,
  setAutoImproveEnabled,
  scoreDraft,
} from '../utils/autoresearchLoop';
import { generateDraftWithFallback } from '../utils/draftGeneration';
import { isOpenAIDraftConfigured } from '../utils/openaiDraft';
import { useAutoresearchAutoImprove } from '../hooks/useAutoresearchAutoImprove';
import { useOpenAIHealth } from '../hooks/useOpenAIHealth';
import { GroundedDataPanel } from './GroundedDataPanel';
import { ImageGenerator } from './ImageGenerator';
import { LinkedInPreview } from './LinkedInPreview';

interface PostComposerViewProps {
  onAddPost: (post: LinkedInPost) => void;
  rlState: RLState;
  updateRlState: (state: RLState) => void;
}

export const PostComposerView: React.FC<PostComposerViewProps> = ({
  onAddPost,
  rlState,
  updateRlState
}) => {
  // Post inputs
  const [selectedAuthor, setSelectedAuthor] = useState<string>('craig');
  const [selectedTone, setSelectedTone] = useState<string>('Thought Leader');
  const [activeSteep, setActiveSteep] = useState<string[]>(['Social', 'Technological']);
  const [groundedText, setGroundedText] = useState<string>('');
  
  // Generation results
  const [postDraft, setPostDraft] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [replacedPhrases, setReplacedPhrases] = useState<string[]>([]);
  const [wasFiltered, setWasFiltered] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isImproving, setIsImproving] = useState<boolean>(false);
  const [improveMsg, setImproveMsg] = useState<string>('');
  const [autoImprove, setAutoImprove] = useState<boolean>(() => isAutoImproveEnabled());
  const [draftMetric, setDraftMetric] = useState<number | null>(null);
  const [draftSource, setDraftSource] = useState<'openai' | 'local' | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const { openai: openaiHealth } = useOpenAIHealth();
  const openaiConfigured = openaiHealth?.configured ?? isOpenAIDraftConfigured();

  // RL Rating States
  const [userRating, setUserRating] = useState<number>(0);
  const [selectedFeedback, setSelectedFeedback] = useState<string[]>([]);
  const [rlAppliedMsg, setRlAppliedMsg] = useState<string>('');

  // Scheduler Modal States
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [scheduledDate, setScheduledDate] = useState<string>('2026-05-28T09:00');

  const activeAuthor = FOUNDER_PROFILES.find(p => p.id === selectedAuthor) || FOUNDER_PROFILES[0];

  const improveInput = useMemo(
    () =>
      postDraft.trim() ?
        {
          draft: postDraft,
          authorId: selectedAuthor,
          tone: selectedTone,
          steepFocus: activeSteep,
          groundedText,
          rlState,
          aspectFeedback: selectedFeedback,
        }
      : null,
    [
      postDraft,
      selectedAuthor,
      selectedTone,
      activeSteep,
      groundedText,
      rlState,
      selectedFeedback,
    ]
  );

  useAutoresearchAutoImprove({
    enabled: autoImprove,
    hasDraft: Boolean(postDraft.trim()),
    input: improveInput,
    onImproved: (content, message) => {
      setPostDraft(content);
      setImproveMsg(message);
      setDraftMetric(scoreDraft(content, rlState, activeSteep));
    },
  });

  const handleToggleSteep = (factor: string) => {
    if (activeSteep.includes(factor)) {
      setActiveSteep(activeSteep.filter(f => f !== factor));
    } else {
      setActiveSteep([...activeSteep, factor]);
    }
  };

  const handleGenerateDraft = () => {
    setIsGenerating(true);
    setRlAppliedMsg('');
    setUserRating(0);
    setSelectedFeedback([]);
    setGenerateError(null);
    setDraftSource(null);

    void (async () => {
      try {
        const result = await generateDraftWithFallback({
          authorId: selectedAuthor,
          tone: selectedTone,
          steepFocus: activeSteep,
          groundedText,
          rlState,
        });
        setPostDraft(result.content);
        setReplacedPhrases(result.replacedPhrases);
        setWasFiltered(result.wasFiltered);
        setDraftSource(result.source);
        setDraftMetric(scoreDraft(result.content, rlState, activeSteep));
        setImproveMsg('');

        if (result.content.toLowerCase().includes('forklift') || result.content.toLowerCase().includes('warehouse')) {
          setSelectedImage('/warehouse_safety.png');
        } else {
          setSelectedImage('/steep_framework.png');
        }
      } catch (err) {
        setGenerateError(err instanceof Error ? err.message : 'Draft generation failed');
      } finally {
        setIsGenerating(false);
      }
    })();
  };

  const handleImproveDraft = async () => {
    if (!postDraft.trim() || !improveInput) return;
    setIsImproving(true);
    setImproveMsg('');
    try {
      const result = await runImproveDraftIteration(improveInput);
      if (result.status === 'keep') {
        setPostDraft(result.content);
        setReplacedPhrases(result.replacedPhrases);
        setWasFiltered(result.replacedPhrases.length > 0);
      }
      setDraftMetric(result.metric);
      setImproveMsg(
        result.status === 'keep' ?
          `Kept (${result.source}): quality ${result.previousMetric} → ${result.metric}`
        : `Discarded (${result.source}): ${result.previousMetric} → ${result.metric} — original kept`
      );
    } catch (err) {
      setImproveMsg(err instanceof Error ? err.message : 'Improve failed');
    } finally {
      setIsImproving(false);
    }
  };

  const handleToggleAutoImprove = () => {
    const next = !autoImprove;
    setAutoImprove(next);
    setAutoImproveEnabled(next);
  };

  // Quick action drafting assistance
  const handleApplyRefinement = (type: string) => {
    if (!postDraft) return;
    
    let updatedText = postDraft;
    if (type === 'bullets') {
      updatedText = postDraft.replace(/\n\n/g, '\n\n• ').replace('• Here is a clear', 'Here is a clear');
    } else if (type === 'hook') {
      updatedText = `🔥 EXPOSING RISK: "Work as Imagined" is a massive liability. Here is the operational reality:\n\n${postDraft}`;
    } else if (type === 'cta') {
      updatedText = `${postDraft}\n\n👉 Read our safety framework analysis at www.seeo.ai`;
    }
    
    setPostDraft(updatedText);
  };

  // Submit rating to reinforcement learning model
  const handleRateDraft = () => {
    if (userRating === 0) return;
    
    const newState = ratePostAndAdapt(userRating, selectedFeedback, activeSteep);
    updateRlState(newState);

    let explanation = `Reward processed! Learning index increased. Adapted weights for STEEP: [${activeSteep.join(', ')}] based on score.`;
    if (userRating >= 4) {
      explanation = `🚀 Positive Reinforcement: Elevated focus metrics for active factors. [${activeSteep.join(', ')}] weights increased (+10%).`;
    } else if (userRating <= 2) {
      explanation = `⚠️ Negative Penalty: Deprioritized active factors. [${activeSteep.join(', ')}] weights decreased (-10%). Emoji density adjusted.`;
    }
    setRlAppliedMsg(explanation);
  };

  const handlePublishNow = () => {
    if (!postDraft) return;
    const newPost: LinkedInPost = {
      id: `post-${Date.now()}`,
      authorId: selectedAuthor,
      content: postDraft,
      image: selectedImage,
      status: 'published',
      likes: 0,
      comments: 0,
      shares: 0,
      steepFocus: activeSteep,
      tone: selectedTone
    };
    onAddPost(newPost);
    alert('🎉 Successfully published to the live Sandbox feed!');
  };

  const handleConfirmSchedule = () => {
    if (!postDraft) return;
    const newPost: LinkedInPost = {
      id: `post-${Date.now()}`,
      authorId: selectedAuthor,
      content: postDraft,
      image: selectedImage,
      status: 'scheduled',
      scheduledTime: scheduledDate,
      steepFocus: activeSteep,
      tone: selectedTone
    };
    onAddPost(newPost);
    setShowScheduleModal(false);
    alert(`📅 Scheduled successfully for ${new Date(scheduledDate).toLocaleString()}`);
  };

  return (
    <div className="view-container composer-view">
      <div className="composer-grid">
        
        {/* Left Side: Creation Controls */}
        <div className="composer-left">
          
          {/* A. Profile Selector */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 className="panel-title" style={{ marginBottom: '14px' }}>1. Author Voice Profile</h3>
            <div className="profile-selector-container">
              {FOUNDER_PROFILES.map((profile) => (
                <div
                  key={profile.id}
                  className={`founder-profile-card ${selectedAuthor === profile.id ? 'active' : ''}`}
                  onClick={() => setSelectedAuthor(profile.id)}
                >
                  <img src={profile.avatar} alt={profile.name} />
                  <span className="founder-name-label">{profile.name}</span>
                  <span className="founder-role-label">{profile.id === 'craig' ? 'Coretex' : profile.id === 'dean' ? 'Hardware' : 'seedigital'}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic', lineHeight: 1.4 }}>
              Voice context: {activeAuthor.bio}
            </p>
          </div>

          {/* B. STEEP Forces Selector */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
              <h3 className="panel-title">2. STEEP Strategic Lenses</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Toggle lenses to focus</span>
            </div>
            <div className="steep-selector-grid">
              {['Social', 'Technological', 'Economic', 'Environmental', 'Political'].map((factor) => {
                const isActive = activeSteep.includes(factor);
                return (
                  <button
                    key={factor}
                    className={`steep-btn ${isActive ? 'active' : ''} ${factor}`}
                    onClick={() => handleToggleSteep(factor)}
                  >
                    {factor}
                  </button>
                );
              })}
            </div>
          </div>

          {/* C. Grounded Data */}
          <GroundedDataPanel groundedText={groundedText} setGroundedText={setGroundedText} />

          {/* D. Tone Selector & Generation Button */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div className="composer-generate-row">
              <div className="composer-generate-row-left">
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Copywriting Tone
                </label>
                <select
                  className="text-input-grounded select-input-grounded"
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                >
                  <option value="Thought Leader">Thought Leader (Analytical & Governance)</option>
                  <option value="Founder Story">Founder Story (Coretex / seedigital History)</option>
                  <option value="Tech Visionary">Tech Visionary (AI & Sensor Telemetry)</option>
                  <option value="Conversational">Conversational (Direct & Engaging)</option>
                </select>
              </div>
              <button
                className="btn btn-accent btn-icon"
                style={{ height: '42px', display: 'flex', gap: '8px', padding: '0 24px' }}
                onClick={handleGenerateDraft}
                disabled={isGenerating}
              >
                <Sparkles size={16} />
                <span>{isGenerating ? 'Drafting...' : 'Generate Draft'}</span>
              </button>
            </div>
          </div>

          {/* E. Image Generation Integration */}
          <ImageGenerator
            postContent={postDraft}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
          />
        </div>

        {/* Right Side: Live LinkedIn sandbox and editing preview */}
        <div className="composer-right">
          <div className="glass-card" style={{ padding: '20px', minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="panel-header">
              <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} color="var(--color-primary)" /> Live Editor & LinkedIn Sandbox
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pixel-perfect simulator</span>
            </div>

            {/* If generating, display beautiful circular loader */}
            {isGenerating ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '16px', minHeight: '300px' }}>
                <div className="circular-spinner"></div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700 }}>Synthesizing Post...</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Interweaving STEEP metrics and profile voice</span>
                </div>
              </div>
            ) : postDraft ? (
              <>
                {(draftSource || generateError) && (
                  <p style={{ fontSize: '11px', color: generateError ? 'var(--color-danger)' : 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    {generateError ??
                      (draftSource === 'openai' ?
                        'Draft from OpenAI (unique each generate).'
                      : 'Draft from local template (add OPENAI_API_KEY to .env and restart dev for LLM drafts).')}
                  </p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Draft Content Editor</label>
                  <textarea
                    className="text-input-grounded"
                    style={{ minHeight: '180px', fontSize: '13px', lineHeight: 1.4 }}
                    aria-label="Draft Content Editor"
                    value={postDraft}
                    onChange={(e) => setPostDraft(e.target.value)}
                  />
                </div>

                {/* 2. RL Auto-refinement alert log if triggered */}
                {wasFiltered && (
                  <div className="refinement-log">
                    <div className="refinement-log-header">
                      <ShieldAlert size={14} />
                      <span>RL Banned Phrase Filtration Successful (diligent refinement)</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      The AI model automatically identified and swapped locked-out corporate terms to maintain voice integrity:
                    </span>
                    <div className="refinement-tag-row">
                      {replacedPhrases.map((phrase, idx) => (
                        <span key={idx} className="refinement-tag">{phrase}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Autoresearch-inspired improve loop */}
                <div
                  className="glass-card"
                  style={{
                    padding: '14px',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    background: 'rgba(16, 185, 129, 0.04)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <FlaskConical size={14} color="var(--color-primary)" />
                      Autoresearch loop (draft improve)
                    </span>
                    {draftMetric !== null && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Quality metric: <strong>{draftMetric}</strong>/100
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.4 }}>
                    One iteration: score draft → propose improvement (OpenAI if configured, else local RL) → keep only if metric rises. Uses ratings, banned phrases, and STEEP weights — not GPU training.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ fontSize: '11px', display: 'flex', gap: '6px', alignItems: 'center' }}
                      disabled={isImproving}
                      onClick={() => void handleImproveDraft()}
                    >
                      <RefreshCw
                        size={14}
                        style={isImproving ? { animation: 'spin 1s linear infinite' } : undefined}
                      />
                      {isImproving ? 'Improving…' : 'Improve draft'}
                    </button>
                    <label
                      style={{
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={autoImprove}
                        onChange={handleToggleAutoImprove}
                      />
                      Auto-improve every 30 min (tab open)
                    </label>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {openaiConfigured ?
                        'OpenAI: /api/generate/draft'
                      : openaiHealth?.message ?? 'Checking OpenAI…'}
                    </span>
                  </div>
                  {improveMsg && (
                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: '11px',
                        color: 'var(--color-primary)',
                        fontWeight: 600,
                      }}
                    >
                      {improveMsg}
                    </div>
                  )}
                </div>

                {/* 3. Assistant Drafting Helpers */}
                <div className="assistant-panel">
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    💡 One-Click Drafting Actions
                  </span>
                  <div className="suggestions-grid">
                    <button className="suggestion-pill" onClick={() => handleApplyRefinement('hook')}>
                      <span>⚡ Add Provocative Hook</span>
                    </button>
                    <button className="suggestion-pill" onClick={() => handleApplyRefinement('bullets')}>
                      <span>✓ Convert into Bullets</span>
                    </button>
                    <button className="suggestion-pill" onClick={() => handleApplyRefinement('cta')}>
                      <span>👉 Append seeo.ai Call-to-Action</span>
                    </button>
                    <button className="suggestion-pill" onClick={handleGenerateDraft}>
                      <span>🔄 Regenerate Segment</span>
                    </button>
                  </div>
                </div>

                {/* 4. LinkedIn Live Preview Frame */}
                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', display: 'block' }}>
                    Sandbox Feed Preview
                  </label>
                  <LinkedInPreview
                    authorId={selectedAuthor}
                    content={postDraft}
                    image={selectedImage}
                    timestamp="Sandbox Preview"
                  />
                </div>

                {/* 5. Reinforcement Learning Feedback Star panel */}
                <div className="post-rating-container">
                  <span style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={14} color="var(--color-warning)" />
                    Rate AI Draft and Adapt RL Weights
                  </span>
                  <div className="stars-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className={`star-btn ${userRating >= star ? 'active' : ''}`}
                        onClick={() => setUserRating(star)}
                      >
                        <span style={{ fontSize: '24px' }}>★</span>
                      </button>
                    ))}
                  </div>

                  {userRating > 0 && (
                    <>
                      <div className="feedback-tag-grid">
                        {['Perfect Voice', 'Too Salesy', 'Love the hook', 'Too AI-sounding', 'Captures history well'].map((tag) => {
                          const isSel = selectedFeedback.includes(tag);
                          return (
                            <div
                              key={tag}
                              className={`feedback-tag-pill ${isSel ? 'active' : ''}`}
                              onClick={() => {
                                if (isSel) setSelectedFeedback(selectedFeedback.filter(t => t !== tag));
                                else setSelectedFeedback([...selectedFeedback, tag]);
                              }}
                            >
                              {tag}
                            </div>
                          );
                        })}
                      </div>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '6px 16px', fontSize: '11px', marginTop: '10px' }}
                        onClick={handleRateDraft}
                      >
                        Train RL Model
                      </button>
                    </>
                  )}

                  {rlAppliedMsg && (
                    <div style={{ fontSize: '11px', color: 'var(--color-primary)', textAlign: 'center', marginTop: '6px', fontWeight: 600, padding: '4px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      {rlAppliedMsg}
                    </div>
                  )}
                </div>

                {/* 6. Action buttons */}
                <div className="composer-actions">
                  <button
                    className="btn btn-accent"
                    style={{ flex: 1, padding: '12px' }}
                    onClick={handlePublishNow}
                  >
                    Post Immediately
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '12px 20px', display: 'flex', gap: '6px' }}
                    onClick={() => setShowScheduleModal(true)}
                  >
                    <Calendar size={18} />
                    <span>Schedule</span>
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
                <span style={{ fontSize: '32px' }}>✍️</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Editor Empty</span>
                <span style={{ fontSize: '12px', maxWidth: '320px' }}>
                  Select your settings on the left (Profile, STEEP forces, upload grounded text) and click **"Generate Draft"** to start!
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Scheduler Modal */}
      {showScheduleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-card" style={{ width: '400px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={18} color="var(--color-primary)" /> Stagger Post Schedule
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Set a date and time to staggered-queue this post. We recommend staggered spaces of 2-3 days for maximum engagement.
            </p>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Choose Date & Time
              </label>
              <input
                type="datetime-local"
                className="text-input-grounded"
                style={{ margin: 0 }}
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleConfirmSchedule}
              >
                Add to Scheduler Queue
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
