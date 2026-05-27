import type { LinkedInPost } from './mockData';

export interface PostPerformanceMetrics {
  postId: string;
  impressions: number;
  reactions: number;
  comments: number;
  shares: number;
  clicks: number;
  engagementRate: number;
  trend: 'up' | 'down' | 'flat';
  updatedAt: string;
  source: 'mock' | 'linkedin';
}

const METRICS_KEY = 'seeo_post_performance_metrics';

function hashSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Deterministic mock metrics — structure matches future LinkedIn Marketing API fields. */
export function generateMockMetrics(post: LinkedInPost): PostPerformanceMetrics {
  const seed = hashSeed(post.id);
  const baseImpressions =
    post.status === 'published' ?
      1200 + (seed % 8000) + (post.likes ?? 0) * 40
    : 400 + (seed % 1200);

  const reactions = post.likes ?? Math.floor((seed % 120) + 10);
  const comments = post.comments ?? Math.floor((seed % 30) + 2);
  const shares = post.shares ?? Math.floor((seed % 15) + 1);
  const clicks = Math.floor((seed % 80) + 5);
  const engagements = reactions + comments + shares;
  const engagementRate =
    Math.round((engagements / Math.max(baseImpressions, 1)) * 10000) / 100;

  const trend: PostPerformanceMetrics['trend'] =
    engagementRate > 5 ? 'up'
    : engagementRate < 2 ? 'down'
    : 'flat';

  return {
    postId: post.id,
    impressions: baseImpressions,
    reactions,
    comments,
    shares,
    clicks,
    engagementRate,
    trend,
    updatedAt: new Date().toISOString(),
    source: 'mock',
  };
}

export function getStoredMetrics(): Record<string, PostPerformanceMetrics> {
  const raw = localStorage.getItem(METRICS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, PostPerformanceMetrics>;
  } catch {
    return {};
  }
}

export function syncMetricsForPosts(posts: LinkedInPost[]): PostPerformanceMetrics[] {
  const stored = getStoredMetrics();
  const next: Record<string, PostPerformanceMetrics> = { ...stored };

  posts.forEach((post) => {
    if (post.status === 'published' || post.status === 'scheduled') {
      if (!next[post.id] || next[post.id].source === 'mock') {
        next[post.id] = generateMockMetrics(post);
      }
    }
  });

  localStorage.setItem(METRICS_KEY, JSON.stringify(next));
  return posts
    .filter((p) => next[p.id])
    .map((p) => next[p.id]);
}

export function aggregateMetrics(metrics: PostPerformanceMetrics[]) {
  if (metrics.length === 0) {
    return {
      totalImpressions: 0,
      averageEngagement: '0%',
      topTrend: 'flat' as const,
    };
  }
  const totalImpressions = metrics.reduce((a, m) => a + m.impressions, 0);
  const avgRate =
    metrics.reduce((a, m) => a + m.engagementRate, 0) / metrics.length;
  const upCount = metrics.filter((m) => m.trend === 'up').length;
  const topTrend: 'up' | 'down' | 'flat' =
    upCount > metrics.length / 2 ? 'up'
    : upCount === 0 ? 'down'
    : 'flat';

  return {
    totalImpressions,
    averageEngagement: `${avgRate.toFixed(1)}%`,
    topTrend,
  };
}
