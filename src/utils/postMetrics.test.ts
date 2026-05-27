import { describe, expect, it, beforeEach } from 'vitest';
import { generateMockMetrics, syncMetricsForPosts, aggregateMetrics } from './postMetrics';
import type { LinkedInPost } from './mockData';

const samplePost: LinkedInPost = {
  id: 'test-post-1',
  authorId: 'craig',
  content: 'Safety post content',
  status: 'published',
  likes: 10,
  comments: 2,
  shares: 1,
  steepFocus: ['Social'],
  tone: 'Thought Leader',
};

describe('postMetrics', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates stable mock metrics for a post id', () => {
    const a = generateMockMetrics(samplePost);
    const b = generateMockMetrics(samplePost);
    expect(a.impressions).toBe(b.impressions);
    expect(a.source).toBe('mock');
  });

  it('syncs and aggregates metrics', () => {
    const list = syncMetricsForPosts([samplePost]);
    expect(list.length).toBe(1);
    const agg = aggregateMetrics(list);
    expect(agg.totalImpressions).toBeGreaterThan(0);
    expect(agg.averageEngagement).toMatch(/%$/);
  });
});
