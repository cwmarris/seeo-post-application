import React, { useCallback, useEffect, useState } from 'react';
import { Link2, Unlink } from 'lucide-react';
import {
  disconnectLinkedIn,
  fetchLinkedInStatus,
  getLinkedInAuthUrl,
  linkedInBannerLabel,
  type LinkedInStatusResponse,
} from '../utils/linkedinApi';
import { getGroundedSessionId } from '../utils/groundedSession';

type LinkedInConnectionPanelProps = {
  onStatusChange?: (status: LinkedInStatusResponse | null) => void;
};

export const LinkedInConnectionPanel: React.FC<LinkedInConnectionPanelProps> = ({
  onStatusChange,
}) => {
  const [status, setStatus] = useState<LinkedInStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchLinkedInStatus();
      setStatus(next);
      onStatusChange?.(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load LinkedIn status');
      setStatus(null);
      onStatusChange?.(null);
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('linkedin') === 'connected' || params.get('linkedin') === 'error') {
      void refresh();
      params.delete('linkedin');
      params.delete('linkedin_error');
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
      window.history.replaceState({}, '', next);
    }
  }, [refresh]);

  const handleConnect = () => {
    window.location.href = getLinkedInAuthUrl(getGroundedSessionId());
  };

  const handleDisconnect = () => {
    void (async () => {
      setBusy(true);
      try {
        await disconnectLinkedIn();
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Disconnect failed');
      } finally {
        setBusy(false);
      }
    })();
  };

  const bannerClass =
    !status || !status.oauthConfigured ? 'linkedin-banner--muted'
    : !status.connected ? 'linkedin-banner--warn'
    : status.livePostingEnabled ? 'linkedin-banner--live'
    : 'linkedin-banner--dry';

  return (
    <div
      className="glass-card linkedin-connection-panel"
      style={{ padding: '16px' }}
      data-testid="linkedin-connection-panel"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h3 className="panel-title" style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link2 size={16} color="var(--color-primary)" />
            LinkedIn connection
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
            Connect your LinkedIn account to publish from the composer. Posting respects{' '}
            <code style={{ fontSize: '11px' }}>LINKEDIN_POST_MODE</code> on the server (default dry run).
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {status?.connected ?
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              disabled={busy || loading}
              onClick={handleDisconnect}
            >
              <Unlink size={14} />
              Disconnect
            </button>
          : <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: '12px' }}
              disabled={busy || loading || status?.oauthConfigured === false}
              onClick={handleConnect}
              data-testid="linkedin-connect-btn"
            >
              Connect LinkedIn
            </button>
          }
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '12px' }}
            disabled={loading}
            onClick={() => void refresh()}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className={`linkedin-status-banner ${bannerClass}`} data-testid="linkedin-status-banner" role="status">
        {loading ? 'Loading LinkedIn status…' : linkedInBannerLabel(status)}
      </div>

      {status?.connected && status.memberName && (
        <p style={{ fontSize: '12px', margin: '8px 0 0', color: 'var(--text-main)' }}>
          Profile: <strong>{status.memberName}</strong>
          {status.memberEmail ? ` · ${status.memberEmail}` : null}
        </p>
      )}

      {error && (
        <p style={{ fontSize: '12px', color: 'var(--color-danger, #f87171)', marginTop: '8px' }}>{error}</p>
      )}
    </div>
  );
};
