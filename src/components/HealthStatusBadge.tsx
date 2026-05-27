import { useEffect, useMemo, useState } from 'react';

type HealthPayload = {
  ok: boolean;
  timestamp: string;
  version: string;
  warnings?: string[];
};

export function HealthStatusBadge(props: { label?: string; intervalMs?: number }) {
  const label = props.label ?? 'Christchurch Hub';
  const intervalMs = props.intervalMs ?? 15_000;

  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const tooltip = useMemo(() => {
    if (connected) return '';
    return error || 'Health check failed';
  }, [connected, error]);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch('/api/health', { method: 'GET', cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = (await res.json()) as HealthPayload;
        if (!payload?.ok) throw new Error('Health check returned ok=false');
        if (cancelled) return;
        setConnected(true);
        setError('');
      } catch (err) {
        if (cancelled) return;
        setConnected(false);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    void check();
    const id = window.setInterval(() => void check(), intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [intervalMs]);

  return (
    <div
      data-testid="health-status-badge"
      title={tooltip}
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.02)',
        padding: '6px 12px',
        border: '1px solid var(--border-glass)',
        borderRadius: '20px',
        fontSize: '12px',
      }}
    >
      <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
      <span style={{ fontWeight: 600 }}>
        {label} — {connected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}

