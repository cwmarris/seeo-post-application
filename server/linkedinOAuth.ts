import {
  getLinkedInApiVersion,
  LINKEDIN_OAUTH_SCOPES,
  type LinkedInPostMode,
} from './linkedinEnv.js';

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';

export type LinkedInTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
};

export type LinkedInMemberProfile = {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;
};

export function buildLinkedInAuthorizationUrl(options: {
  clientId: string;
  redirectUri: string;
  state: string;
  scopes?: readonly string[];
}): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: options.clientId,
    redirect_uri: options.redirectUri,
    state: options.state,
    scope: (options.scopes ?? LINKEDIN_OAUTH_SCOPES).join(' '),
  });
  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

export async function exchangeLinkedInAuthorizationCode(options: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  fetchImpl?: typeof fetch;
}): Promise<LinkedInTokenResponse> {
  const fetchFn = options.fetchImpl ?? fetch;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: options.code,
    redirect_uri: options.redirectUri,
    client_id: options.clientId,
    client_secret: options.clientSecret,
  });

  const res = await fetchFn(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const payload = (await res.json()) as LinkedInTokenResponse & { error?: string; error_description?: string };
  if (!res.ok) {
    const detail = payload.error_description ?? payload.error ?? res.statusText;
    throw new Error(`LinkedIn token exchange failed (${res.status}): ${detail}`);
  }
  if (!payload.access_token) {
    throw new Error('LinkedIn token exchange returned no access_token');
  }
  return payload;
}

export async function fetchLinkedInMemberProfile(
  accessToken: string,
  fetchImpl?: typeof fetch
): Promise<LinkedInMemberProfile> {
  const fetchFn = fetchImpl ?? fetch;
  const res = await fetchFn(LINKEDIN_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'LinkedIn-Version': getLinkedInApiVersion(),
    },
  });

  const payload = (await res.json()) as LinkedInMemberProfile & { error?: string; message?: string };
  if (!res.ok) {
    const detail = payload.message ?? payload.error ?? res.statusText;
    throw new Error(`LinkedIn userinfo failed (${res.status}): ${detail}`);
  }
  if (!payload.sub) {
    throw new Error('LinkedIn userinfo missing sub (member id)');
  }
  return payload;
}

export function memberUrnFromSub(sub: string): string {
  return `urn:li:person:${sub}`;
}

export function linkedInFeedPreviewUrl(postUrn: string): string {
  return `https://www.linkedin.com/feed/update/${encodeURIComponent(postUrn)}`;
}

export function dryRunPreviewUrl(memberUrn: string): string {
  return `https://www.linkedin.com/feed/?seeo_dry_run=${encodeURIComponent(memberUrn)}`;
}

export type LinkedInPostPayload = {
  author: string;
  commentary: string;
  visibility: 'PUBLIC' | 'CONNECTIONS';
  distribution: {
    feedDistribution: 'MAIN_FEED';
    targetEntities: [];
    thirdPartyDistributionChannels: [];
  };
  lifecycleState: 'PUBLISHED';
  isReshareDisabledByAuthor: boolean;
};

export function buildMemberTextPostPayload(
  memberUrn: string,
  commentary: string
): LinkedInPostPayload {
  return {
    author: memberUrn,
    commentary,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };
}

export async function createLinkedInMemberPost(options: {
  accessToken: string;
  payload: LinkedInPostPayload;
  apiVersion?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ postUrn: string; previewUrl: string }> {
  const fetchFn = options.fetchImpl ?? fetch;
  const apiVersion = options.apiVersion ?? getLinkedInApiVersion();

  const res = await fetchFn('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': apiVersion,
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(options.payload),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    const detail = errBody.message ?? errBody.error ?? res.statusText;
    throw new Error(`LinkedIn create post failed (${res.status}): ${detail}`);
  }

  const postUrn =
    res.headers.get('x-restli-id') ??
    ((await res.json().catch(() => null)) as { id?: string } | null)?.id;
  if (!postUrn) {
    throw new Error('LinkedIn create post succeeded but no post URN was returned');
  }

  return {
    postUrn,
    previewUrl: linkedInFeedPreviewUrl(postUrn),
  };
}

export type ExecuteLinkedInPostResult = {
  mode: LinkedInPostMode;
  success: boolean;
  message: string;
  previewUrl?: string;
  postUrn?: string;
  authorUrn?: string;
  payload?: LinkedInPostPayload;
};

export async function executeLinkedInPost(options: {
  mode: LinkedInPostMode;
  accessToken: string;
  memberUrn: string;
  commentary: string;
  fetchImpl?: typeof fetch;
}): Promise<ExecuteLinkedInPostResult> {
  const payload = buildMemberTextPostPayload(options.memberUrn, options.commentary);

  if (options.mode === 'mock') {
    return {
      mode: 'mock',
      success: true,
      message: 'Mock: LinkedIn post skipped (no API call).',
      authorUrn: options.memberUrn,
      payload,
    };
  }

  if (options.mode === 'dry_run') {
    return {
      mode: 'dry_run',
      success: true,
      message: 'Would post to LinkedIn (dry run)',
      previewUrl: dryRunPreviewUrl(options.memberUrn),
      authorUrn: options.memberUrn,
      payload,
    };
  }

  const live = await createLinkedInMemberPost({
    accessToken: options.accessToken,
    payload,
    fetchImpl: options.fetchImpl,
  });

  return {
    mode: 'live',
    success: true,
    message: 'Posted to LinkedIn.',
    previewUrl: live.previewUrl,
    postUrn: live.postUrn,
    authorUrn: options.memberUrn,
    payload,
  };
}
