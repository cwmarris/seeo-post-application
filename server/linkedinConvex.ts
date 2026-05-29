import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';
import { getConvexUrlForServer, type LinkedInPostMode } from './linkedinEnv.js';

export type StoredLinkedInConnection = {
  sessionId: string;
  memberId: string;
  memberName?: string;
  memberEmail?: string;
  memberUrn: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scopes?: string;
  postMode?: Extract<LinkedInPostMode, 'dry_run' | 'live'>;
};

export type PublicLinkedInStatus = {
  connected: boolean;
  memberId?: string;
  memberName?: string;
  memberEmail?: string;
  memberUrn?: string;
  expiresAt?: number;
  scopes?: string;
  postMode?: Extract<LinkedInPostMode, 'dry_run' | 'live'>;
};

export type LinkedInMetricsSnapshot = {
  source: 'linkedin';
  impressions: number;
  membersReached?: number;
  reactions: number;
  comments: number;
  reshares: number;
  saves?: number;
  sends?: number;
  linkClicks?: number;
  engagementRate: number;
  syncedAt: number;
  syncStatus: 'synced' | 'error';
  error?: string;
};

export type TrackedLinkedInPost = {
  sessionId: string;
  postUrn: string;
  authorUrn: string;
  commentary: string;
  previewUrl?: string;
  mode: 'live';
  publishedAt: number;
  createdAt: number;
  updatedAt: number;
};

export type TrackedLinkedInPostWithMetrics = {
  post: TrackedLinkedInPost;
  metrics: (LinkedInMetricsSnapshot & { postUrn: string }) | null;
};

function getClient(): ConvexHttpClient | null {
  const url = getConvexUrlForServer();
  if (!url) return null;
  return new ConvexHttpClient(url);
}

export async function getLinkedInStatus(sessionId: string): Promise<PublicLinkedInStatus> {
  const client = getClient();
  if (!client) {
    return { connected: false };
  }

  const status = await client.query(api.linkedinConnections.getBySession, { sessionId });
  return status ?? { connected: false };
}

export async function getLinkedInTokenRow(
  sessionId: string
): Promise<StoredLinkedInConnection | null> {
  const client = getClient();
  if (!client) return null;

  const row = await client.query(api.linkedinConnections.getTokenBySession, { sessionId });
  if (!row) return null;

  return {
    sessionId: row.sessionId,
    memberId: row.memberId,
    memberName: row.memberName,
    memberEmail: row.memberEmail,
    memberUrn: row.memberUrn,
    accessToken: row.accessToken,
    refreshToken: row.refreshToken,
    expiresAt: row.expiresAt,
    scopes: row.scopes,
    postMode: row.postMode,
  };
}

export async function saveLinkedInConnection(
  connection: StoredLinkedInConnection
): Promise<void> {
  const client = getClient();
  if (!client) {
    throw new Error(
      'Convex is not configured (set CONVEX_URL or VITE_CONVEX_URL for LinkedIn token storage)'
    );
  }

  await client.mutation(api.linkedinConnections.upsertFromOAuth, {
    sessionId: connection.sessionId,
    memberId: connection.memberId,
    memberName: connection.memberName,
    memberEmail: connection.memberEmail,
    memberUrn: connection.memberUrn,
    accessToken: connection.accessToken,
    refreshToken: connection.refreshToken,
    expiresAt: connection.expiresAt,
    scopes: connection.scopes,
  });
}

export async function setLinkedInStoredPostMode(
  sessionId: string,
  postMode: Extract<LinkedInPostMode, 'dry_run' | 'live'>
): Promise<PublicLinkedInStatus> {
  const client = getClient();
  if (!client) {
    throw new Error('Convex is not configured for LinkedIn mode storage');
  }

  return await client.mutation(api.linkedinConnections.setPostMode, { sessionId, postMode });
}

export async function saveTrackedLinkedInPost(post: {
  sessionId: string;
  postUrn: string;
  authorUrn: string;
  commentary: string;
  previewUrl?: string;
  publishedAt: number;
}): Promise<void> {
  const client = getClient();
  if (!client) return;

  await client.mutation(api.linkedinPostMetrics.upsertTrackedPost, post);
}

export async function saveLinkedInMetrics(
  sessionId: string,
  postUrn: string,
  metrics: LinkedInMetricsSnapshot
): Promise<void> {
  const client = getClient();
  if (!client) {
    throw new Error('Convex is not configured for LinkedIn metrics storage');
  }

  await client.mutation(api.linkedinPostMetrics.upsertMetrics, {
    sessionId,
    postUrn,
    impressions: metrics.impressions,
    membersReached: metrics.membersReached,
    reactions: metrics.reactions,
    comments: metrics.comments,
    reshares: metrics.reshares,
    saves: metrics.saves,
    sends: metrics.sends,
    linkClicks: metrics.linkClicks,
    engagementRate: metrics.engagementRate,
    syncedAt: metrics.syncedAt,
    syncStatus: metrics.syncStatus,
    error: metrics.error,
  });
}

export async function listTrackedLinkedInPosts(
  sessionId: string
): Promise<TrackedLinkedInPostWithMetrics[]> {
  const client = getClient();
  if (!client) return [];

  const rows = await client.query(api.linkedinPostMetrics.listBySession, { sessionId });
  return rows.map((row) => ({
    post: {
      sessionId: row.post.sessionId,
      postUrn: row.post.postUrn,
      authorUrn: row.post.authorUrn,
      commentary: row.post.commentary,
      previewUrl: row.post.previewUrl,
      mode: row.post.mode,
      publishedAt: row.post.publishedAt,
      createdAt: row.post.createdAt,
      updatedAt: row.post.updatedAt,
    },
    metrics: row.metrics ?
      {
        postUrn: row.metrics.postUrn,
        source: row.metrics.source,
        impressions: row.metrics.impressions,
        membersReached: row.metrics.membersReached,
        reactions: row.metrics.reactions,
        comments: row.metrics.comments,
        reshares: row.metrics.reshares,
        saves: row.metrics.saves,
        sends: row.metrics.sends,
        linkClicks: row.metrics.linkClicks,
        engagementRate: row.metrics.engagementRate,
        syncedAt: row.metrics.syncedAt,
        syncStatus: row.metrics.syncStatus,
        error: row.metrics.error,
      }
    : null,
  }));
}

export async function disconnectLinkedIn(sessionId: string): Promise<void> {
  const client = getClient();
  if (!client) return;
  await client.mutation(api.linkedinConnections.disconnect, { sessionId });
}
