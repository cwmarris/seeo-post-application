import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

const MAX_TEXT_CHARS = 200_000;
const MAX_DOCS_PER_SESSION = 50;

const groundedDocValidator = v.object({
  _id: v.id('groundedDocuments'),
  _creationTime: v.number(),
  sessionId: v.string(),
  authorId: v.optional(v.string()),
  name: v.string(),
  mimeType: v.string(),
  textContent: v.string(),
  storageId: v.optional(v.id('_storage')),
  createdAt: v.number(),
});

export const listBySession = query({
  args: { sessionId: v.string() },
  returns: v.array(groundedDocValidator),
  handler: async (ctx, args) => {
    const sessionId = args.sessionId.trim();
    if (!sessionId) return [];

    const rows = await ctx.db
      .query('groundedDocuments')
      .withIndex('by_session_created', (q) => q.eq('sessionId', sessionId))
      .order('desc')
      .collect();

    return rows;
  },
});

export const createFromText = mutation({
  args: {
    sessionId: v.string(),
    name: v.string(),
    mimeType: v.string(),
    textContent: v.string(),
    authorId: v.optional(v.string()),
  },
  returns: v.id('groundedDocuments'),
  handler: async (ctx, args) => {
    const sessionId = args.sessionId.trim();
    if (!sessionId) throw new Error('sessionId is required');

    const name = args.name.trim();
    if (!name || name.length > 255) {
      throw new Error('Document name must be between 1 and 255 characters');
    }

    const mimeType = args.mimeType.trim().toLowerCase();
    if (!mimeType) throw new Error('mimeType is required');

    const textContent = args.textContent.trim();
    if (!textContent) throw new Error('textContent cannot be empty');
    if (textContent.length > MAX_TEXT_CHARS) {
      throw new Error(`textContent exceeds ${MAX_TEXT_CHARS} characters`);
    }

    const existing = await ctx.db
      .query('groundedDocuments')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .collect();

    if (existing.length >= MAX_DOCS_PER_SESSION) {
      throw new Error(`Maximum ${MAX_DOCS_PER_SESSION} grounded documents per session`);
    }

    return await ctx.db.insert('groundedDocuments', {
      sessionId,
      authorId: args.authorId?.trim() || undefined,
      name,
      mimeType,
      textContent,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    sessionId: v.string(),
    documentId: v.id('groundedDocuments'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sessionId = args.sessionId.trim();
    const doc = await ctx.db.get(args.documentId);
    if (!doc) return null;
    if (doc.sessionId !== sessionId) {
      throw new Error('Document does not belong to this session');
    }
    if (doc.storageId) {
      await ctx.storage.delete(doc.storageId);
    }
    await ctx.db.delete(args.documentId);
    return null;
  },
});
