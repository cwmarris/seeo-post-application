import { Cpu } from 'lucide-react';
import { useAppHealthModels } from '../hooks/useAppHealthModels';

export function ModelIndicator(props: {
  lastGeneratedModel?: string | null;
  compact?: boolean;
  variant?: 'compact' | 'banner';
}) {
  const { models } = useAppHealthModels();
  const draftLabel = models.draftModel;
  const variant = props.variant ?? (props.compact ? 'compact' : 'banner');

  if (variant === 'banner') {
    return (
      <div className="model-indicator-banner" data-testid="model-indicator-banner">
        <Cpu size={18} color="var(--color-primary)" aria-hidden />
        <div className="model-indicator-banner-text">
          <span className="model-indicator-banner-label">Active draft model</span>
          <span>
            <strong>{draftLabel}</strong>
            {props.lastGeneratedModel && props.lastGeneratedModel !== draftLabel ?
              <>
                {' '}
                · Last generated with <strong>{props.lastGeneratedModel}</strong>
              </>
            : props.lastGeneratedModel ?
              <> · Last run used <strong>{props.lastGeneratedModel}</strong></>
            : null}
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <p
        data-testid="model-indicator"
        style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}
      >
        Draft model: <strong>{draftLabel}</strong>
        {props.lastGeneratedModel && props.lastGeneratedModel !== draftLabel ?
          <> · Last generated with: <strong>{props.lastGeneratedModel}</strong></>
        : null}
      </p>
    );
  }

  return null;
}
