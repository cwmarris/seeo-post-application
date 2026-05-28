import React, { useState, useEffect, useRef } from 'react';
import { Image, RefreshCw } from 'lucide-react';
import { generateVisualAsset } from '../utils/openaiImages';

interface ImageGeneratorProps {
  postContent: string;
  groundedContextSnippet?: string;
  selectedImage: string | undefined;
  setSelectedImage: (img: string | undefined) => void;
}

interface GuidanceLog {
  timestamp: string;
  message: string;
}

const STYLES = [
  { id: 'editorial', label: 'Industrial Editorial Photo' },
  { id: 'vector', label: 'Minimalist Vector Graphic' },
  { id: 'gradient', label: 'Abstract Neon Gradient' }
];

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  postContent,
  groundedContextSnippet,
  selectedImage,
  setSelectedImage
}) => {
  const [activeStyle, setActiveStyle] = useState('editorial');
  const [promptText, setPromptText] = useState('');
  const [guidance, setGuidance] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<GuidanceLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const logTimeoutsRef = useRef<number[]>([]);

  const suggestedPrompt = (() => {
    if (postContent) {
      if (postContent.toLowerCase().includes('forklift') || postContent.toLowerCase().includes('warehouse')) {
        return 'A professional, industrial editorial photograph of a warehouse with a forklift operating inside a designated green safety zone overlay, high-fidelity cameras, realistic lighting.';
      }
      return 'A modern minimalist SaaS graphic representing the STEEP business foresight framework, elegant geometric nodes in safety green and obsidian, clean branding.';
    }
    return 'A highly professional, editorial branding graphic for seeo.ai, emphasizing safety intelligence.';
  })();

  const groundedHint =
    groundedContextSnippet?.trim() ?
      ` Grounded facts to reflect visually: ${groundedContextSnippet.trim().slice(0, 400)}`
    : '';

  const effectivePrompt = (promptText.trim() ? promptText : suggestedPrompt) + groundedHint;

  const clearScheduledLogs = () => {
    logTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    logTimeoutsRef.current = [];
  };

  const addLog = (msg: string, delay: number) => {
    const id = window.setTimeout(() => {
      const time = new Date().toLocaleTimeString();
      setLogs((prev) => [...prev, { timestamp: time, message: msg }]);
    }, delay);
    logTimeoutsRef.current.push(id);
  };

  const handleGenerate = async (isRedo: boolean) => {
    setIsGenerating(true);
    setError(null);
    setLogs([]);
    clearScheduledLogs();

    if (!isRedo) {
      addLog('Connecting to OpenAI Images API (gpt-image-2)...', 100);
      addLog(`Applying style: [${activeStyle.toUpperCase()}]`, 400);
      addLog('Matching seeo.ai brand palette (safety green / obsidian)...', 800);
    } else {
      addLog('Regenerating with your guidance...', 100);
      addLog(`Guidance: "${guidance}"`, 400);
    }

    try {
      const result = await generateVisualAsset({
        prompt: effectivePrompt,
        style: activeStyle,
        guidance: isRedo ? guidance : undefined
      });

      addLog(
        result.revisedPrompt
          ? `Model refined prompt: ${result.revisedPrompt.slice(0, 80)}…`
          : `Rendered with ${result.model}.`,
        1200
      );
      addLog('Success — visual asset ready for preview.', 1400);

      window.setTimeout(() => {
        setSelectedImage(result.imageDataUrl);
        setIsGenerating(false);
        if (isRedo) setGuidance('');
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Image generation failed';
      const time = new Date().toLocaleTimeString();
      setLogs((prev) => [...prev, { timestamp: time, message: `Error: ${message}` }]);
      setError(message);
      setIsGenerating(false);
    }
  };

  useEffect(() => () => clearScheduledLogs(), []);

  return (
    <div className="glass-card image-generator-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Image size={18} color="var(--color-accent)" /> seeo Visual Generator
        </h3>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>OpenAI Images</span>
      </div>

      {error && (
        <div
          role="alert"
          className="image-generator-error"
          style={{
            fontSize: '12px',
            color: 'var(--color-danger)',
            margin: '0 0 8px',
            lineHeight: 1.45,
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid color-mix(in srgb, var(--color-danger) 35%, transparent)',
            background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)'
          }}
        >
          <strong style={{ display: 'block', marginBottom: '4px' }}>Image generation failed</strong>
          {error}
        </div>
      )}

      <div>
        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
          Asset Style
        </label>
        <div className="image-style-grid">
          {STYLES.map((style) => (
            <div
              key={style.id}
              className={`image-style-card ${activeStyle === style.id ? 'active' : ''}`}
              onClick={() => setActiveStyle(style.id)}
            >
              {style.label}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
          Core Visual Prompt
        </label>
        <textarea
          className="text-input-grounded"
          style={{ minHeight: '60px', fontSize: '13px' }}
          value={promptText || suggestedPrompt}
          onChange={(e) => setPromptText(e.target.value)}
        />
      </div>

      <div className="image-guidance-area">
        {isGenerating && (
          <div className="generation-loader-overlay">
            <div className="circular-spinner"></div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>Generating Asset...</span>
              <span style={{ fontSize: '11px', color: 'var(--color-accent)' }}>OpenAI image model</span>
            </div>
            <div className="guidance-logs">
              {logs.map((log, idx) => (
                <div key={idx} style={{ marginBottom: '2px' }}>
                  <span style={{ color: 'var(--color-accent)' }}>[{log.timestamp}]</span> {log.message}
                </div>
              ))}
            </div>
          </div>
        )}

        <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <RefreshCw size={12} color="var(--color-accent)" />
          <span>Iterate / Redo Image with Guidance</span>
        </label>

        <input
          type="text"
          className="text-input-grounded"
          style={{ margin: 0, fontSize: '13px' }}
          placeholder="E.g., 'Make the warehouse lighting warmer and emphasize the green safety zone lines'..."
          value={guidance}
          onChange={(e) => setGuidance(e.target.value)}
        />

        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <button
            className="btn btn-accent"
            style={{ flex: 1, padding: '8px 16px', fontSize: '13px' }}
            onClick={() => void handleGenerate(!!guidance.trim())}
            disabled={isGenerating}
          >
            {guidance.trim() ? 'Redo Image with Guidance' : 'Generate Visual Asset'}
          </button>

          {selectedImage && (
            <button
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '13px' }}
              onClick={() => setSelectedImage(undefined)}
              disabled={isGenerating}
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
