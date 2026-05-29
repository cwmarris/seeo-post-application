export type LinkedInPostMode = 'mock' | 'dry_run' | 'live';

const POST_MODE_VALUES: LinkedInPostMode[] = ['mock', 'dry_run', 'live'];

/** Default API version header (YYYYMM). Override with LINKEDIN_API_VERSION. */
export const DEFAULT_LINKEDIN_API_VERSION = '202601';

export function resolveLinkedInPostMode(raw?: string): LinkedInPostMode {
  const value = (raw ?? 'dry_run').trim().toLowerCase();
  if (POST_MODE_VALUES.includes(value as LinkedInPostMode)) {
    return value as LinkedInPostMode;
  }
  return 'dry_run';
}

export function isLinkedInOAuthConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    env.LINKEDIN_CLIENT_ID?.trim() && env.LINKEDIN_CLIENT_SECRET?.trim()
  );
}

export function getLinkedInRedirectUri(env: NodeJS.ProcessEnv = process.env): string | null {
  const explicit = env.LINKEDIN_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  return null;
}

export function getLinkedInApiVersion(env: NodeJS.ProcessEnv = process.env): string {
  return env.LINKEDIN_API_VERSION?.trim() || DEFAULT_LINKEDIN_API_VERSION;
}

export function getConvexUrlForServer(env: NodeJS.ProcessEnv = process.env): string | null {
  const url = env.CONVEX_URL?.trim() || env.VITE_CONVEX_URL?.trim();
  return url || null;
}

export function getAppReturnBase(env: NodeJS.ProcessEnv = process.env): string {
  const fromEnv =
    env.LINKEDIN_APP_RETURN_URL?.trim() ||
    env.APP_BASE_URL?.trim() ||
    env.VERCEL_URL?.trim();
  if (!fromEnv) return '/';
  if (fromEnv.startsWith('http://') || fromEnv.startsWith('https://')) {
    return fromEnv.replace(/\/$/, '');
  }
  return `https://${fromEnv.replace(/\/$/, '')}`;
}

export const LINKEDIN_BASE_OAUTH_SCOPES = [
  'openid',
  'profile',
  'email',
  'w_member_social',
] as const;

export const LINKEDIN_MEMBER_ANALYTICS_SCOPES = ['r_member_postAnalytics'] as const;

export function getLinkedInOAuthScopes(env: NodeJS.ProcessEnv = process.env): string[] {
  const scopes: string[] = [...LINKEDIN_BASE_OAUTH_SCOPES];
  if (env.LINKEDIN_ENABLE_MEMBER_ANALYTICS?.trim().toLowerCase() !== 'false') {
    scopes.push(...LINKEDIN_MEMBER_ANALYTICS_SCOPES);
  }

  const extra = env.LINKEDIN_EXTRA_SCOPES?.trim();
  if (extra) {
    scopes.push(...extra.split(/[,\s]+/).filter(Boolean));
  }

  return [...new Set(scopes)];
}

export const LINKEDIN_OAUTH_SCOPES = [
  ...LINKEDIN_BASE_OAUTH_SCOPES,
  ...LINKEDIN_MEMBER_ANALYTICS_SCOPES,
] as const;

export const LINKEDIN_ORG_POST_SCOPES = ['w_organization_social', 'r_organization_social'] as const;
