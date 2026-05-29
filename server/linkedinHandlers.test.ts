import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  handleLinkedInAuth,
  handleLinkedInMode,
  handleLinkedInPost,
  handleLinkedInStatus,
} from './linkedinHandlers.js';
import * as linkedinConvex from './linkedinConvex.js';

function mockResponse(): ServerResponse & {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: '',
    setHeader(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
    },
    end(chunk?: string) {
      if (chunk) this.body += chunk;
    },
  } as ServerResponse & { statusCode: number; headers: Record<string, string>; body: string };
  return res;
}

function mockRequest(method: string, url: string, body?: string): IncomingMessage {
  const readable = {
    method,
    url,
    async *[Symbol.asyncIterator]() {
      if (body) yield Buffer.from(body);
    },
  };
  return readable as unknown as IncomingMessage;
}

describe('linkedinHandlers', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env.LINKEDIN_CLIENT_ID = 'test-client';
    process.env.LINKEDIN_CLIENT_SECRET = 'test-secret';
    process.env.LINKEDIN_REDIRECT_URI = 'http://localhost:5173/api/linkedin/callback';
    process.env.LINKEDIN_POST_MODE = 'mock';
  });

  afterEach(() => {
    process.env = { ...envBackup };
    vi.restoreAllMocks();
  });

  it('redirects auth to LinkedIn when configured', async () => {
    const req = mockRequest('GET', '/api/linkedin/auth?sessionId=sess-1');
    const res = mockResponse();

    await handleLinkedInAuth(req, res);

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toContain('linkedin.com/oauth/v2/authorization');
    expect(res.headers.location).toContain('state=sess-1');
  });

  it('returns status with post mode', async () => {
    vi.spyOn(linkedinConvex, 'getLinkedInStatus').mockResolvedValue({
      connected: false,
    });

    const req = mockRequest('GET', '/api/linkedin/status?sessionId=sess-1');
    const res = mockResponse();

    await handleLinkedInStatus(req, res);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.postMode).toBe('mock');
    expect(body.oauthConfigured).toBe(true);
  });

  it('posts in mock mode without convex connection', async () => {
    vi.spyOn(linkedinConvex, 'getLinkedInTokenRow').mockResolvedValue(null);

    const req = mockRequest('POST', '/api/linkedin/post', JSON.stringify({
      sessionId: 'sess-1',
      commentary: 'Test post body',
    }));
    const res = mockResponse();

    await handleLinkedInPost(req, res);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.mode).toBe('mock');
    expect(body.success).toBe(true);
  });

  it('switches live mode only when the session is connected', async () => {
    vi.spyOn(linkedinConvex, 'getLinkedInTokenRow').mockResolvedValue({
      sessionId: 'sess-1',
      memberId: 'member-1',
      memberName: 'Craig Marris',
      memberUrn: 'urn:li:person:member-1',
      accessToken: 'token',
      expiresAt: Date.now() + 3600_000,
      scopes: 'openid profile email w_member_social',
    });
    vi.spyOn(linkedinConvex, 'setLinkedInStoredPostMode').mockResolvedValue({
      connected: true,
      memberId: 'member-1',
      memberName: 'Craig Marris',
      memberUrn: 'urn:li:person:member-1',
      expiresAt: Date.now() + 3600_000,
      scopes: 'openid profile email w_member_social',
      postMode: 'live',
    });

    const req = mockRequest('POST', '/api/linkedin/mode', JSON.stringify({
      sessionId: 'sess-1',
      mode: 'live',
    }));
    const res = mockResponse();

    await handleLinkedInMode(req, res);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.postMode).toBe('live');
    expect(body.livePostingEnabled).toBe(true);
  });
});
