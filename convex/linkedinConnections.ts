import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

const connectionValidator = v.object({
  _id: v.id('linkedinConnections'),
  _creationTime: v.number(),
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
});

const publicConnectionValidator = v.object({
  connected: v.boolean(),
  memberId: v.optional(v.string()),
  memberName: v.optional(v.string()),
  memberEmail: v.optional(v.string()),
  memberUrn: v.optional(v.string()),
  expiresAt: v.optional(v.number()),
  scopes: v.optional(v.string()),
  postMode: v.optional(v.union(v.literal('dry_run'), v.literal('live'))),
});

export const getBySession = query({
  args: { sessionId: v.string() },
  returns: v.union(publicConnectionValidator, v.null()),
  handler: async (ctx, args) => {
    const sessionId = args.sessionId.trim();
    if (!sessionId) return null;

    const row = await ctx.db
      .query('linkedinConnections')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .unique();

    if (!row) {
      return { connected: false };
    }

    return {
      connected: true,
      memberId: row.memberId,
      memberName: row.memberName,
      memberEmail: row.memberEmail,
      memberUrn: row.memberUrn,
      expiresAt: row.expiresAt,
      scopes: row.scopes,
      postMode: row.postMode,
    };
  },
});

export const getTokenBySession = query({
  args: { sessionId: v.string() },
  returns: v.union(connectionValidator, v.null()),
  handler: async (ctx, args) => {
    const sessionId = args.sessionId.trim();
    if (!sessionId) return null;

    return await ctx.db
      .query('linkedinConnections')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .unique();
  },
});

export const setPostMode = mutation({
  args: {
    sessionId: v.string(),
    postMode: v.union(v.literal('dry_run'), v.literal('live')),
  },
  returns: publicConnectionValidator,
  handler: async (ctx, args) => {
    const sessionId = args.sessionId.trim();
    if (!sessionId) throw new Error('sessionId is required');

    const existing = await ctx.db
      .query('linkedinConnections')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .unique();

    if (!existing) {
      throw new Error('LinkedIn is not connected for this session');
    }

    await ctx.db.patch(existing._id, {
      postMode: args.postMode,
      updatedAt: Date.now(),
    });

    return {
      connected: true,
      memberId: existing.memberId,
      memberName: existing.memberName,
      memberEmail: existing.memberEmail,
      memberUrn: existing.memberUrn,
      expiresAt: existing.expiresAt,
      scopes: existing.scopes,
      postMode: args.postMode,
    };
  },
});

export const upsertFromOAuth = mutation({
  args: {
    sessionId: v.string(),
    memberId: v.string(),
    memberName: v.optional(v.string()),
    memberEmail: v.optional(v.string()),
    memberUrn: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
    scopes: v.optional(v.string()),
  },
  returns: v.id('linkedinConnections'),
  handler: async (ctx, args) => {
    const sessionId = args.sessionId.trim();
    if (!sessionId) throw new Error('sessionId is required');

    const now = Date.now();
    const existing = await ctx.db
      .query('linkedinConnections')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .unique();

    const doc = {
      sessionId,
      memberId: args.memberId,
      memberName: args.memberName,
      memberEmail: args.memberEmail,
      memberUrn: args.memberUrn,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
      scopes: args.scopes,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return existing._id;
    }

    return await ctx.db.insert('linkedinConnections', {
      ...doc,
      createdAt: now,
    });
  },
});

export const disconnect = mutation({
  args: { sessionId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sessionId = args.sessionId.trim();
    if (!sessionId) return null;

    const existing = await ctx.db
      .query('linkedinConnections')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});
