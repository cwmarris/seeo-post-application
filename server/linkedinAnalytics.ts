import { getLinkedInApiVersion } from './linkedinEnv.js';
import type { LinkedInMetricsSnapshot } from './linkedinConvex.js';

export const LINKEDIN_MEMBER_ANALYTICS_SCOPE = 'r_member_postAnalytics';

const MEMBER_ANALYTICS_METRICS = [
  'IMPRESSION',
  'MEMBERS_REACHED',
  'REACTION',
  'COMMENT',
  'RESHARE',
] as const;

type MemberAnalyticsMetric = (typeof MEMBER_ANALYTICS_METRICS)[number];

type MemberAnalyticsResponse = {
  elements?: Array<{
    count?: number;
    metricType?: string | Record<string, string>;
  }>;
  message?: string;
  error?: string;
  status?: number;
};

export function hasLinkedInScope(scopes: string | undefined, required: string): boolean {
  return new Set((scopes ?? '').split(/[,\s]+/).filter(Boolean)).has(required);
}

function entityParamForPostUrn(postUrn: string): string {
  if (postUrn.startsWith('urn:li:ugcPost:')) {
    return `(ugc:${encodeURIComponent(postUrn)})`;
  }
  return `(share:${encodeURIComponent(postUrn)})`;
}

function extractMetricCount(payload: MemberAnalyticsResponse): number {
  return (payload.elements ?? []).reduce((sum, element) => sum + (element.count ?? 0), 0);
}

async function fetchMemberPostMetric(options: {
  accessToken: string;
  postUrn: string;
  metric: MemberAnalyticsMetric;
  fetchImpl?: typeof fetch;
}): Promise<number> {
  const fetchFn = options.fetchImpl ?? fetch;
  const query = new URLSearchParams({
    q: 'entity',
    queryType: options.metric,
    aggregation: 'TOTAL',
  });
  const url =
    `https://api.linkedin.com/rest/memberCreatorPostAnalytics?${query.toString()}` +
    `&entity=${entityParamForPostUrn(options.postUrn)}`;

  const res = await fetchFn(url, {
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      'LinkedIn-Version': getLinkedInApiVersion(),
      'X-Restli-Protocol-Version': '2.0.0',
      'Content-Type': 'application/json',
    },
  });

  const payload = (await res.json().catch(() => ({}))) as MemberAnalyticsResponse;
  if (!res.ok) {
    const detail = payload.message ?? payload.error ?? res.statusText;
    throw new Error(`LinkedIn ${options.metric} analytics failed (${res.status}): ${detail}`);
  }

  return extractMetricCount(payload);
}

export async function fetchLinkedInMemberPostMetrics(options: {
  accessToken: string;
  postUrn: string;
  fetchImpl?: typeof fetch;
}): Promise<LinkedInMetricsSnapshot> {
  const values = await Promise.all(
    MEMBER_ANALYTICS_METRICS.map(async (metric) => [
      metric,
      await fetchMemberPostMetric({
        accessToken: options.accessToken,
        postUrn: options.postUrn,
        metric,
        fetchImpl: options.fetchImpl,
      }),
    ] as const)
  );
  const metrics = Object.fromEntries(values) as Record<MemberAnalyticsMetric, number>;
  const engagements = metrics.REACTION + metrics.COMMENT + metrics.RESHARE;
  const engagementRate = metrics.IMPRESSION > 0 ? engagements / metrics.IMPRESSION : 0;

  return {
    source: 'linkedin',
    impressions: metrics.IMPRESSION,
    membersReached: metrics.MEMBERS_REACHED,
    reactions: metrics.REACTION,
    comments: metrics.COMMENT,
    reshares: metrics.RESHARE,
    engagementRate,
    syncedAt: Date.now(),
    syncStatus: 'synced',
  };
}

export function buildLinkedInMetricsErrorSnapshot(error: unknown): LinkedInMetricsSnapshot {
  return {
    source: 'linkedin',
    impressions: 0,
    reactions: 0,
    comments: 0,
    reshares: 0,
    engagementRate: 0,
    syncedAt: Date.now(),
    syncStatus: 'error',
    error: error instanceof Error ? error.message : 'LinkedIn metrics sync failed',
  };
}
