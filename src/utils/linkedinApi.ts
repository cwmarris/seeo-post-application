import { getGroundedSessionId } from './groundedSession';

export type LinkedInPostMode = 'mock' | 'dry_run' | 'live';

export type LinkedInStatusResponse = {
  connected: boolean;
  memberId?: string;
  memberName?: string;
  memberEmail?: string;
  memberUrn?: string;
  expiresAt?: number;
  scopes?: string;
  postMode: LinkedInPostMode;
  oauthConfigured: boolean;
  livePostingEnabled: boolean;
};

export type LinkedInPostApiResult = {
  mode: LinkedInPostMode;
  success: boolean;
  message: string;
  previewUrl?: string;
  postUrn?: string;
  authorUrn?: string;
};

function apiBase(): string {
  const fromEnv = import.meta.env.VITE_LINKEDIN_API_BASE_URL as string | undefined;
  if (fromEnv?.trim()) return fromEnv.trim().replace(/\/$/, '');
  return '';
}

function linkedInPath(path: string, sessionId: string, extra?: Record<string, string>): string {
  const params = new URLSearchParams({ sessionId, ...extra });
  return `${apiBase()}${path}?${params.toString()}`;
}

export function getLinkedInAuthUrl(sessionId?: string): string {
  const id = sessionId ?? getGroundedSessionId();
  return linkedInPath('/api/linkedin/auth', id);
}

export async function fetchLinkedInStatus(sessionId?: string): Promise<LinkedInStatusResponse> {
  const id = sessionId ?? getGroundedSessionId();
  const res = await fetch(linkedInPath('/api/linkedin/status', id));
  if (!res.ok) {
    throw new Error(`LinkedIn status failed (${res.status})`);
  }
  return (await res.json()) as LinkedInStatusResponse;
}

export async function disconnectLinkedIn(sessionId?: string): Promise<void> {
  const id = sessionId ?? getGroundedSessionId();
  const res = await fetch(`${apiBase()}/api/linkedin/disconnect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: id }),
  });
  if (!res.ok) {
    throw new Error(`LinkedIn disconnect failed (${res.status})`);
  }
}

export async function setLinkedInPostMode(
  mode: Extract<LinkedInPostMode, 'dry_run' | 'live'>,
  sessionId?: string
): Promise<Pick<LinkedInStatusResponse, 'postMode' | 'livePostingEnabled'>> {
  const id = sessionId ?? getGroundedSessionId();
  const res = await fetch(`${apiBase()}/api/linkedin/mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: id, mode }),
  });

  const body = (await res.json()) as Pick<LinkedInStatusResponse, 'postMode' | 'livePostingEnabled'> & { error?: string };
  if (!res.ok) {
    throw new Error(body.error ?? `LinkedIn mode change failed (${res.status})`);
  }
  return body;
}

export async function postToLinkedIn(commentary: string, sessionId?: string): Promise<LinkedInPostApiResult> {
  const id = sessionId ?? getGroundedSessionId();
  const res = await fetch(`${apiBase()}/api/linkedin/post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: id, commentary }),
  });

  const body = (await res.json()) as LinkedInPostApiResult & { error?: string };
  if (!res.ok) {
    throw new Error(body.error ?? `LinkedIn post failed (${res.status})`);
  }
  return body;
}

export function linkedInBannerLabel(status: LinkedInStatusResponse | null): string {
  if (!status) return 'LinkedIn: Checking…';
  if (!status.oauthConfigured) return 'LinkedIn: OAuth not configured on server';
  if (!status.connected) return 'LinkedIn: Not connected';
  if (status.postMode === 'live' && status.livePostingEnabled) {
    return `Connected as ${status.memberName ?? 'member'} (live posting enabled)`;
  }
  if (status.postMode === 'dry_run') {
    return `Connected (${status.memberName ?? 'member'}) · dry run — live posting disabled`;
  }
  return `Connected (${status.memberName ?? 'member'}) · mock mode`;
}
