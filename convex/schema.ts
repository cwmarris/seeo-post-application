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
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_session', ['sessionId']),
});
