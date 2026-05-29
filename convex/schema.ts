import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  groundedDocuments: defineTable({
    sessionId: v.string(),
    authorId: v.optional(v.string()),
    name: v.string(),
    mimeType: v.string(),
    textContent: v.string(),
    storageId: v.optional(v.id('_storage')),
    createdAt: v.number(),
  })
    .index('by_session', ['sessionId'])
    .index('by_session_created', ['sessionId', 'createdAt']),

  /** OAuth tokens for LinkedIn posting — keyed by browser session (see getGroundedSessionId). */
  linkedinConnections: defineTable({
    sessionId: v.string(),
    memberId: v.string(),
    memberName: v.optional(v.string()),
    memberEmail: v.optional(v.string()),
    memberUrn: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
    scopes: v.optional(v.string()),
    postMode: v.optional(v.union(v.literal('dry_run'), v.literal('live'))),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_session', ['sessionId']),

  linkedinPosts: defineTable({
    sessionId: v.string(),
    postUrn: v.string(),
    authorUrn: v.string(),
    commentary: v.string(),
    previewUrl: v.optional(v.string()),
    mode: v.union(v.literal('live')),
    publishedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_session', ['sessionId'])
    .index('by_session_created', ['sessionId', 'createdAt'])
    .index('by_session_post_urn', ['sessionId', 'postUrn']),

  linkedinPostMetrics: defineTable({
    sessionId: v.string(),
    postUrn: v.string(),
    source: v.union(v.literal('linkedin')),
    impressions: v.number(),
    membersReached: v.optional(v.number()),
    reactions: v.number(),
    comments: v.number(),
    reshares: v.number(),
    saves: v.optional(v.number()),
    sends: v.optional(v.number()),
    linkClicks: v.optional(v.number()),
    engagementRate: v.number(),
    syncedAt: v.number(),
    syncStatus: v.union(v.literal('synced'), v.literal('error')),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_session', ['sessionId'])
    .index('by_session_post_urn', ['sessionId', 'postUrn'])
    .index('by_session_synced', ['sessionId', 'syncedAt']),
});
