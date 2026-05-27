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
});
