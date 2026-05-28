import { describe, expect, it, vi } from 'vitest';
import {
  buildLinkedInAuthorizationUrl,
  buildMemberTextPostPayload,
  executeLinkedInPost,
  exchangeLinkedInAuthorizationCode,
  fetchLinkedInMemberProfile,
  memberUrnFromSub,
} from './linkedinOAuth.js';

describe('linkedinOAuth', () => {
  it('builds authorization URL with state and scopes', () => {
    const url = buildLinkedInAuthorizationUrl({
      clientId: 'client-id',
      redirectUri: 'http://localhost:5173/api/linkedin/callback',
      state: 'session-abc',
    });
    expect(url).toContain('linkedin.com/oauth/v2/authorization');
    expect(url).toContain('client_id=client-id');
    expect(url).toContain('state=session-abc');
    expect(url).toContain('w_member_social');
  });

  it('exchanges authorization code for tokens', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'at-123',
        expires_in: 3600,
        scope: 'openid w_member_social',
      }),
    });

    const token = await exchangeLinkedInAuthorizationCode({
      code: 'auth-code',
      clientId: 'id',
      clientSecret: 'secret',
      redirectUri: 'http://localhost/callback',
      fetchImpl: fetchMock,
    });

    expect(token.access_token).toBe('at-123');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://www.linkedin.com/oauth/v2/accessToken',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('fetches member profile from userinfo', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sub: 'AbCdEf',
        name: 'Craig Marris',
        email: 'craig@example.com',
      }),
    });

    const profile = await fetchLinkedInMemberProfile('token', fetchMock);
    expect(profile.sub).toBe('AbCdEf');
    expect(memberUrnFromSub(profile.sub)).toBe('urn:li:person:AbCdEf');
  });

  it('dry_run does not call LinkedIn posts API', async () => {
    const fetchMock = vi.fn();
    const result = await executeLinkedInPost({
      mode: 'dry_run',
      accessToken: 'token',
      memberUrn: 'urn:li:person:1',
      commentary: 'Hello LinkedIn',
      fetchImpl: fetchMock,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('dry run');
    expect(result.previewUrl).toContain('linkedin.com');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('mock mode skips HTTP', async () => {
    const fetchMock = vi.fn();
    const result = await executeLinkedInPost({
      mode: 'mock',
      accessToken: 'token',
      memberUrn: 'urn:li:person:1',
      commentary: 'Hello',
      fetchImpl: fetchMock,
    });
    expect(result.mode).toBe('mock');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('live mode posts to rest/posts', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: (key: string) => (key === 'x-restli-id' ? 'urn:li:share:999' : null) },
      json: async () => ({}),
    });

    const payload = buildMemberTextPostPayload('urn:li:person:1', 'Live post');
    expect(payload.author).toBe('urn:li:person:1');

    const result = await executeLinkedInPost({
      mode: 'live',
      accessToken: 'live-token',
      memberUrn: 'urn:li:person:1',
      commentary: 'Live post',
      fetchImpl: fetchMock,
    });

    expect(result.mode).toBe('live');
    expect(result.postUrn).toBe('urn:li:share:999');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.linkedin.com/rest/posts',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
