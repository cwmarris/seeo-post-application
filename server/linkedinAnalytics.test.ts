import { describe, expect, it, vi } from 'vitest';
import {
  fetchLinkedInMemberPostMetrics,
  hasLinkedInScope,
  LINKEDIN_MEMBER_ANALYTICS_SCOPE,
} from './linkedinAnalytics.js';

describe('linkedinAnalytics', () => {
  it('detects analytics scope from comma or space separated scope strings', () => {
    expect(hasLinkedInScope(
      `openid profile w_member_social ${LINKEDIN_MEMBER_ANALYTICS_SCOPE}`,
      LINKEDIN_MEMBER_ANALYTICS_SCOPE
    )).toBe(true);
    expect(hasLinkedInScope(
      `email,openid,profile,w_member_social,${LINKEDIN_MEMBER_ANALYTICS_SCOPE}`,
      LINKEDIN_MEMBER_ANALYTICS_SCOPE
    )).toBe(true);
  });

  it('fetches and aggregates core member post metrics', async () => {
    const metricValues: Record<string, number> = {
      IMPRESSION: 1200,
      MEMBERS_REACHED: 900,
      REACTION: 35,
      COMMENT: 4,
      RESHARE: 2,
    };
    const fetchMock = vi.fn(async (url: string) => {
      const queryType = new URL(url).searchParams.get('queryType') ?? '';
      return {
        ok: true,
        json: async () => ({ elements: [{ count: metricValues[queryType] ?? 0 }] }),
      };
    });

    const metrics = await fetchLinkedInMemberPostMetrics({
      accessToken: 'token',
      postUrn: 'urn:li:share:123',
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    expect(metrics.impressions).toBe(1200);
    expect(metrics.membersReached).toBe(900);
    expect(metrics.reactions).toBe(35);
    expect(metrics.comments).toBe(4);
    expect(metrics.reshares).toBe(2);
    expect(metrics.engagementRate).toBeCloseTo(41 / 1200);
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(fetchMock.mock.calls[0][0]).toContain('memberCreatorPostAnalytics');
    expect(fetchMock.mock.calls[0][0]).toContain('entity=(share:urn%3Ali%3Ashare%3A123)');
  });
});
