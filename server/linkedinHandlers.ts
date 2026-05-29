import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  buildLinkedInAuthorizationUrl,
  exchangeLinkedInAuthorizationCode,
  executeLinkedInPost,
  fetchLinkedInMemberProfile,
  memberUrnFromSub,
} from './linkedinOAuth.js';
import {
  disconnectLinkedIn,
  getLinkedInStatus,
  getLinkedInTokenRow,
  listTrackedLinkedInPosts,
  saveLinkedInMetrics,
  saveLinkedInConnection,
  saveTrackedLinkedInPost,
  setLinkedInStoredPostMode,
} from './linkedinConvex.js';
import {
  getAppReturnBase,
  getLinkedInOAuthScopes,
  getLinkedInRedirectUri,
  isLinkedInOAuthConfigured,
} from './linkedinEnv.js';
import {
  buildLinkedInMetricsErrorSnapshot,
  fetchLinkedInMemberPostMetrics,
  hasLinkedInScope,
  LINKEDIN_MEMBER_ANALYTICS_SCOPE,
} from './linkedinAnalytics.js';
import { getEffectiveLinkedInPostMode, isSwitchableLinkedInPostMode } from './linkedinMode.js';

function readQuery(req: IncomingMessage): URLSearchParams {
  const url = req.url ?? '';
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) return new URLSearchParams();
  return new URLSearchParams(url.slice(queryIndex + 1));
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function redirect(res: ServerResponse, location: string): void {
  res.statusCode = 302;
  res.setHeader('Location', location);
  res.end();
}

function requireSessionId(params: URLSearchParams, body?: { sessionId?: string }): string | null {
  const fromQuery = params.get('sessionId')?.trim();
  if (fromQuery) return fromQuery;
  const fromBody = body?.sessionId?.trim();
  return fromBody || null;
}

async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return {} as T;
  return JSON.parse(raw) as T;
}

export async function handleLinkedInAuth(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (!isLinkedInOAuthConfigured()) {
    sendJson(res, 503, {
      error: 'LinkedIn OAuth is not configured',
      hint: 'Set LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, and LINKEDIN_REDIRECT_URI',
    });
    return;
  }

  const params = readQuery(req);
  const sessionId = requireSessionId(params);
  if (!sessionId) {
    sendJson(res, 400, { error: 'sessionId query parameter is required' });
    return;
  }

  const redirectUri = getLinkedInRedirectUri();
  if (!redirectUri) {
    sendJson(res, 503, { error: 'LINKEDIN_REDIRECT_URI is not set' });
    return;
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID!.trim();
  const authUrl = buildLinkedInAuthorizationUrl({
    clientId,
    redirectUri,
    state: sessionId,
    scopes: getLinkedInOAuthScopes(),
  });

  redirect(res, authUrl);
}

export async function handleLinkedInCallback(
  req: IncomingMessage,
  res: ServerResponse,
  fetchImpl?: typeof fetch
): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const base = getAppReturnBase();
  const returnUrl = new URL('/', base);

  const params = readQuery(req);
  const oauthError = params.get('error');
  if (oauthError) {
    returnUrl.searchParams.set('linkedin', 'error');
    returnUrl.searchParams.set('linkedin_error', oauthError);
    redirect(res, returnUrl.toString());
    return;
  }

  const code = params.get('code');
  const sessionId = params.get('state')?.trim();
  if (!code || !sessionId) {
    returnUrl.searchParams.set('linkedin', 'error');
    returnUrl.searchParams.set('linkedin_error', 'missing_code_or_state');
    redirect(res, returnUrl.toString());
    return;
  }

  if (!isLinkedInOAuthConfigured()) {
    returnUrl.searchParams.set('linkedin', 'error');
    returnUrl.searchParams.set('linkedin_error', 'not_configured');
    redirect(res, returnUrl.toString());
    return;
  }

  const redirectUri = getLinkedInRedirectUri();
  if (!redirectUri) {
    returnUrl.searchParams.set('linkedin', 'error');
    returnUrl.searchParams.set('linkedin_error', 'missing_redirect_uri');
    redirect(res, returnUrl.toString());
    return;
  }

  try {
    const token = await exchangeLinkedInAuthorizationCode({
      code,
      clientId: process.env.LINKEDIN_CLIENT_ID!.trim(),
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!.trim(),
      redirectUri,
      fetchImpl,
    });

    const profile = await fetchLinkedInMemberProfile(token.access_token, fetchImpl);
    const memberUrn = memberUrnFromSub(profile.sub);
    const expiresAt = Date.now() + token.expires_in * 1000;

    await saveLinkedInConnection({
      sessionId,
      memberId: profile.sub,
      memberName: profile.name,
      memberEmail: profile.email,
      memberUrn,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt,
      scopes: token.scope,
    });

    returnUrl.searchParams.set('linkedin', 'connected');
    redirect(res, returnUrl.toString());
  } catch (err) {
    returnUrl.searchParams.set('linkedin', 'error');
    returnUrl.searchParams.set(
      'linkedin_error',
      err instanceof Error ? err.message : 'callback_failed'
    );
    redirect(res, returnUrl.toString());
  }
}

export async function handleLinkedInStatus(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const params = readQuery(req);
  const sessionId = requireSessionId(params);
  if (!sessionId) {
    sendJson(res, 400, { error: 'sessionId query parameter is required' });
    return;
  }

  const oauthConfigured = isLinkedInOAuthConfigured();
  const status = await getLinkedInStatus(sessionId);
  const postMode = getEffectiveLinkedInPostMode(status.postMode);

  sendJson(res, 200, {
    ...status,
    postMode,
    oauthConfigured,
    livePostingEnabled: postMode === 'live',
  });
}

export async function handleLinkedInMode(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  let body: { sessionId?: string; mode?: string };
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  const sessionId = requireSessionId(readQuery(req), body);
  if (!sessionId) {
    sendJson(res, 400, { error: 'sessionId is required' });
    return;
  }

  const mode = body.mode?.trim();
  if (!isSwitchableLinkedInPostMode(mode)) {
    sendJson(res, 400, { error: 'mode must be dry_run or live' });
    return;
  }

  if (!isLinkedInOAuthConfigured()) {
    sendJson(res, 503, { error: 'LinkedIn OAuth is not configured' });
    return;
  }

  const connection = await getLinkedInTokenRow(sessionId);
  if (!connection) {
    sendJson(res, 401, { error: 'Connect LinkedIn before changing post mode' });
    return;
  }
  if (connection.expiresAt < Date.now()) {
    sendJson(res, 401, { error: 'LinkedIn access token expired — reconnect LinkedIn' });
    return;
  }

  if (mode === 'live') {
    const scopes = connection.scopes ?? '';
    if (!scopes.includes('w_member_social')) {
      sendJson(res, 403, { error: 'LinkedIn connection is missing w_member_social scope' });
      return;
    }
  }

  const nextStatus = await setLinkedInStoredPostMode(sessionId, mode);
  const postMode = getEffectiveLinkedInPostMode(nextStatus.postMode);
  sendJson(res, 200, {
    postMode,
    livePostingEnabled: postMode === 'live',
  });
}

export async function handleLinkedInDisconnect(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  let body: { sessionId?: string };
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  const sessionId = requireSessionId(readQuery(req), body);
  if (!sessionId) {
    sendJson(res, 400, { error: 'sessionId is required' });
    return;
  }

  await disconnectLinkedIn(sessionId);
  sendJson(res, 200, { disconnected: true });
}

export async function handleLinkedInPost(
  req: IncomingMessage,
  res: ServerResponse,
  fetchImpl?: typeof fetch
): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  let body: { sessionId?: string; commentary?: string };
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body' });
    return;
  }

  const sessionId = requireSessionId(readQuery(req), body);
  const commentary = body.commentary?.trim();
  if (!sessionId) {
    sendJson(res, 400, { error: 'sessionId is required' });
    return;
  }
  if (!commentary) {
    sendJson(res, 400, { error: 'commentary is required' });
    return;
  }

  const connection = await getLinkedInTokenRow(sessionId);
  const postMode = getEffectiveLinkedInPostMode(connection?.postMode);

  if (!connection && postMode !== 'mock') {
    sendJson(res, 401, {
      error: 'LinkedIn not connected for this session',
      postMode,
    });
    return;
  }

  const memberUrn = connection?.memberUrn ?? 'urn:li:person:mock';
  const accessToken = connection?.accessToken ?? 'mock-token';

  if (connection && connection.expiresAt < Date.now() && postMode === 'live') {
    sendJson(res, 401, {
      error: 'LinkedIn access token expired — reconnect LinkedIn',
      postMode,
    });
    return;
  }

  try {
    const result = await executeLinkedInPost({
      mode: postMode,
      accessToken,
      memberUrn,
      commentary,
      fetchImpl,
    });

    if (connection && result.mode === 'live' && result.postUrn) {
      await saveTrackedLinkedInPost({
        sessionId,
        postUrn: result.postUrn,
        authorUrn: result.authorUrn ?? memberUrn,
        commentary,
        previewUrl: result.previewUrl,
        publishedAt: Date.now(),
      });
    }

    sendJson(res, 200, result);
  } catch (err) {
    sendJson(res, 502, {
      error: err instanceof Error ? err.message : 'LinkedIn post failed',
      postMode,
    });
  }
}

export async function handleLinkedInMetrics(
  req: IncomingMessage,
  res: ServerResponse,
  fetchImpl?: typeof fetch
): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  let body: { sessionId?: string; sync?: boolean } = {};
  if (req.method === 'POST') {
    try {
      body = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON body' });
      return;
    }
  }

  const params = readQuery(req);
  const sessionId = requireSessionId(params, body);
  if (!sessionId) {
    sendJson(res, 400, { error: 'sessionId is required' });
    return;
  }

  const shouldSync = req.method === 'POST' || params.get('sync') === 'true' || body.sync === true;
  const trackedBeforeSync = await listTrackedLinkedInPosts(sessionId);
  let syncError: string | undefined;
  let syncedCount = 0;

  if (shouldSync && trackedBeforeSync.length > 0) {
    const connection = await getLinkedInTokenRow(sessionId);
    if (!connection) {
      syncError = 'Connect LinkedIn before syncing metrics.';
    } else if (connection.expiresAt < Date.now()) {
      syncError = 'LinkedIn access token expired — reconnect LinkedIn.';
    } else if (!hasLinkedInScope(connection.scopes, LINKEDIN_MEMBER_ANALYTICS_SCOPE)) {
      syncError =
        `Reconnect LinkedIn with ${LINKEDIN_MEMBER_ANALYTICS_SCOPE} to sync real impressions.`;
    } else {
      for (const row of trackedBeforeSync) {
        try {
          const metrics = await fetchLinkedInMemberPostMetrics({
            accessToken: connection.accessToken,
            postUrn: row.post.postUrn,
            fetchImpl,
          });
          await saveLinkedInMetrics(sessionId, row.post.postUrn, metrics);
          syncedCount += 1;
        } catch (err) {
          await saveLinkedInMetrics(
            sessionId,
            row.post.postUrn,
            buildLinkedInMetricsErrorSnapshot(err)
          );
          syncError = err instanceof Error ? err.message : 'LinkedIn metrics sync failed';
        }
      }
    }
  }

  const trackedPosts = await listTrackedLinkedInPosts(sessionId);
  sendJson(res, 200, {
    trackedPosts,
    syncedCount,
    syncError,
    analyticsScopeRequired: LINKEDIN_MEMBER_ANALYTICS_SCOPE,
    analyticsAvailable: !syncError,
  });
}

export function createLinkedInMiddleware(
  fetchImpl?: typeof fetch
): (req: IncomingMessage, res: ServerResponse, next: () => void) => void {
  return (req, res, next) => {
    const path = req.url?.split('?')[0];
    if (!path?.startsWith('/api/linkedin')) {
      next();
      return;
    }

    void (async () => {
      try {
        if (path === '/api/linkedin/auth') {
          await handleLinkedInAuth(req, res);
          return;
        }
        if (path === '/api/linkedin/callback') {
          await handleLinkedInCallback(req, res, fetchImpl);
          return;
        }
        if (path === '/api/linkedin/status') {
          await handleLinkedInStatus(req, res);
          return;
        }
        if (path === '/api/linkedin/mode') {
          await handleLinkedInMode(req, res);
          return;
        }
        if (path === '/api/linkedin/metrics') {
          await handleLinkedInMetrics(req, res, fetchImpl);
          return;
        }
        if (path === '/api/linkedin/disconnect' && req.method === 'POST') {
          await handleLinkedInDisconnect(req, res);
          return;
        }
        if (path === '/api/linkedin/post') {
          await handleLinkedInPost(req, res, fetchImpl);
          return;
        }
        sendJson(res, 404, { error: 'Not found' });
      } catch (err) {
        sendJson(res, 500, {
          error: err instanceof Error ? err.message : 'LinkedIn handler error',
        });
      }
    })();
  };
}
