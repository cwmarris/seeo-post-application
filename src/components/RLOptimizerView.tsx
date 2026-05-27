import React, { useState } from 'react';
import { TrendingUp, ShieldAlert, CheckSquare, Plus, Trash, FlaskConical } from 'lucide-react';
import { type RLState, addBannedWord, removeBannedWord } from '../utils/rlEngine';
import { getExperiments } from '../utils/autoresearchLoop';

interface RLOptimizerViewProps {
  rlState: RLState;
  updateRlState: (state: RLState) => void;
}

export const RLOptimizerView: React.FC<RLOptimizerViewProps> = ({
  rlState,
  updateRlState
}) => {
  const [newBanned, setNewBanned] = useState('');
  const [experiments] = useState(() => getExperiments());

  const handleSliderChange = (factor: string, value: number) => {
    const updated = { ...rlState };
    updated.steepWeights[factor] = value;
    updateRlState(updated);
  };

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBanned.trim()) {
      const updated = addBannedWord(newBanned.trim());
      updateRlState(updated);
      setNewBanned('');
    }
  };

  const handleRemoveWord = (word: string) => {
    const updated = removeBannedWord(word);
    updateRlState(updated);
  };

  return (
    <div className="view-container">
      <div className="rl-grid">
        
        {/* Left Side: RL Slider Weights and Settings */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div className="panel-header" style={{ marginBottom: '18px' }}>
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--color-primary)" /> STEEP Reinforcement Weight Matrix
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Dynamically tuned</span>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.4 }}>
            These weights represent the AI model's structural preferences for the STEEP framework. As you rate drafts 4 or 5 stars in the composer, the weights for active lenses increase. Low-rated drafts (1 or 2 stars) decrease focus weights. You can also tune these weights manually below:
          </p>

          <div className="rl-sliders-container">
            {Object.entries(rlState.steepWeights).map(([factor, weight]) => (
              <div key={factor} className="rl-slider-row">
                <div className="rl-slider-header">
                  <span>{factor} Force</span>
                  <span style={{ color: 'var(--color-primary)' }}>{weight}% focus</span>
                </div>
                <div className="rl-slider-wrapper">
                  <input
                    type="range"
                    className="rl-slider"
                    min="0"
                    max="100"
                    value={weight}
                    onChange={(e) => handleSliderChange(factor, parseInt(e.target.value))}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Model Statistics summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px', borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Training Rated Items
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-primary)' }}>
                {rlState.postCountRated}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Synonyms Filtered
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--color-accent-hover)' }}>
                {rlState.bannedPhrasesReplacedCount}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Banned Word list and filter controls */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div className="panel-header" style={{ marginBottom: '18px' }}>
            <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="var(--color-accent)" /> Banned Phrases & Clichés
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Auto-filtered</span>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.4 }}>
            Tired of generic "AI jargon"? Register words and phrases below that you NEVER want seeo.ai posts to generate (e.g., *"delve"*, *"testament"*, *"in today's digital world"*). If the generator hits any registered phrase, it will execute a silent **Synonym Refinement Loop** before displaying the draft!
          </p>

          <form onSubmit={handleAddWord} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              type="text"
              className="text-input-grounded"
              style={{ margin: 0 }}
              placeholder="E.g., 'paradigm shift', 'delve', 'moreover'..."
              value={newBanned}
              onChange={(e) => setNewBanned(e.target.value)}
            />
            <button type="submit" className="btn btn-accent" style={{ padding: '0 20px', whiteSpace: 'nowrap' }}>
              <Plus size={16} /> Add Phrase
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
              Active Banned Registry:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '200px', overflowY: 'auto', padding: '4px' }}>
              {rlState.bannedWords.map((word) => (
                <div
                  key={word}
                  className="file-tag active"
                  style={{ background: 'rgba(255, 77, 44, 0.08)', border: '1px solid rgba(255, 77, 44, 0.25)', color: 'var(--text-main)', padding: '6px 12px' }}
                >
                  <span>"{word}"</span>
                  <button type="button" onClick={() => handleRemoveWord(word)}>
                    <Trash size={12} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Structured Layout toggles */}
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckSquare size={14} color="var(--color-primary)" />
              <span>RL Structural Preferences</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Start drafts with a provocative statement/hook', checked: rlState.hookStyle === 'provocative' },
                { label: 'Prefer data-driven empirical analysis hooks', checked: rlState.hookStyle === 'empirical' },
                { label: 'Suppress excessive emoji usage (low density active)', checked: rlState.emojiDensity === 'low' },
                { label: 'Automatically append seeo.ai context call-to-actions', checked: true }
              ].map((pref, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                  <input
                    type="checkbox"
                    checked={pref.checked}
                    readOnly
                    style={{ accentColor: 'var(--color-primary)', cursor: 'default' }}
                  />
                  <span style={{ color: 'var(--text-muted)' }}>{pref.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <div className="glass-card" style={{ padding: '24px', marginTop: '20px' }}>
        <div className="panel-header" style={{ marginBottom: '12px' }}>
          <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FlaskConical size={18} color="var(--color-primary)" /> Autoresearch experiment log
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>keep / discard (local)</span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Each &quot;Improve draft&quot; run in the Composer logs metric and status here — analogous to{' '}
          <code>results.tsv</code> in karpathy/autoresearch.
        </p>
        {experiments.length === 0 ?
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No experiments yet. Run Improve draft in the Composer.</p>
        : <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '6px' }}>Time</th>
                  <th style={{ padding: '6px' }}>Metric</th>
                  <th style={{ padding: '6px' }}>Status</th>
                  <th style={{ padding: '6px' }}>Source</th>
                  <th style={{ padding: '6px' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {experiments.slice(0, 12).map((exp) => (
                  <tr key={exp.id} style={{ borderTop: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '6px' }}>{new Date(exp.timestamp).toLocaleString()}</td>
                    <td style={{ padding: '6px' }}>{exp.metric}</td>
                    <td style={{ padding: '6px', color: exp.status === 'keep' ? 'var(--color-primary)' : undefined }}>
                      {exp.status}
                    </td>
                    <td style={{ padding: '6px' }}>{exp.source}</td>
                    <td style={{ padding: '6px' }}>{exp.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  );
};
