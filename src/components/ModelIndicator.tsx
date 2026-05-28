import { useAppHealthModels } from '../hooks/useAppHealthModels';

export function ModelIndicator(props: {
  lastGeneratedModel?: string | null;
  compact?: boolean;
}) {
  const { models } = useAppHealthModels();
  const draftLabel = models.draftModel;

  if (props.compact) {
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

  return (
    <div
      data-testid="model-indicator"
      style={{
        fontSize: '11px',
        color: 'var(--text-muted)',
        lineHeight: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      <span>
        Draft model: <strong style={{ color: 'var(--text-main)' }}>{draftLabel}</strong>
      </span>
      {props.lastGeneratedModel ?
        <span>
          Last generated with:{' '}
          <strong style={{ color: 'var(--text-main)' }}>{props.lastGeneratedModel}</strong>
        </span>
      : null}
    </div>
  );
}
