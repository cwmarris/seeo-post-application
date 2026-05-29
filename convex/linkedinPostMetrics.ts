import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

const trackedPostValidator = v.object({
  _id: v.id('linkedinPosts'),
  _creationTime: v.number(),
  sessionId: v.string(),
  postUrn: v.string(),
  authorUrn: v.string(),
  commentary: v.string(),
  previewUrl: v.optional(v.string()),
  mode: v.union(v.literal('live')),
  publishedAt: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const metricsValidator = v.object({
  _id: v.id('linkedinPostMetrics'),
  _creationTime: v.number(),
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
});

const trackedPostWithMetricsValidator = v.object({
  post: trackedPostValidator,
  metrics: v.union(metricsValidator, v.null()),
});

export const upsertTrackedPost = mutation({
  args: {
    sessionId: v.string(),
    postUrn: v.string(),
    authorUrn: v.string(),
    commentary: v.string(),
    previewUrl: v.optional(v.string()),
    publishedAt: v.number(),
  },
  returns: v.id('linkedinPosts'),
  handler: async (ctx, args) => {
    const sessionId = args.sessionId.trim();
    const postUrn = args.postUrn.trim();
    if (!sessionId) throw new Error('sessionId is required');
    if (!postUrn) throw new Error('postUrn is required');

    const now = Date.now();
    const existing = await ctx.db
      .query('linkedinPosts')
      .withIndex('by_session_post_urn', (q) =>
        q.eq('sessionId', sessionId).eq('postUrn', postUrn)
      )
      .unique();

    const doc = {
      sessionId,
      postUrn,
      authorUrn: args.authorUrn,
      commentary: args.commentary,
      previewUrl: args.previewUrl,
      mode: 'live' as const,
      publishedAt: args.publishedAt,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return existing._id;
    }

    return await ctx.db.insert('linkedinPosts', {
      ...doc,
      createdAt: now,
    });
  },
});

export const upsertMetrics = mutation({
  args: {
    sessionId: v.string(),
    postUrn: v.string(),
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
  },
  returns: v.id('linkedinPostMetrics'),
  handler: async (ctx, args) => {
    const sessionId = args.sessionId.trim();
    const postUrn = args.postUrn.trim();
    if (!sessionId) throw new Error('sessionId is required');
    if (!postUrn) throw new Error('postUrn is required');

    const now = Date.now();
    const existing = await ctx.db
      .query('linkedinPostMetrics')
      .withIndex('by_session_post_urn', (q) =>
        q.eq('sessionId', sessionId).eq('postUrn', postUrn)
      )
      .unique();

    const doc = {
      sessionId,
      postUrn,
      source: 'linkedin' as const,
      impressions: args.impressions,
      membersReached: args.membersReached,
      reactions: args.reactions,
      comments: args.comments,
      reshares: args.reshares,
      saves: args.saves,
      sends: args.sends,
      linkClicks: args.linkClicks,
      engagementRate: args.engagementRate,
      syncedAt: args.syncedAt,
      syncStatus: args.syncStatus,
      error: args.error,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return existing._id;
    }

    return await ctx.db.insert('linkedinPostMetrics', {
      ...doc,
      createdAt: now,
    });
  },
});

export const listBySession = query({
  args: { sessionId: v.string() },
  returns: v.array(trackedPostWithMetricsValidator),
  handler: async (ctx, args) => {
    const sessionId = args.sessionId.trim();
    if (!sessionId) return [];

    const posts = await ctx.db
      .query('linkedinPosts')
      .withIndex('by_session_created', (q) => q.eq('sessionId', sessionId))
      .order('desc')
      .collect();

    const rows = await Promise.all(
      posts.map(async (post) => {
        const metrics = await ctx.db
          .query('linkedinPostMetrics')
          .withIndex('by_session_post_urn', (q) =>
            q.eq('sessionId', sessionId).eq('postUrn', post.postUrn)
          )
          .unique();

        return { post, metrics };
      })
    );

    return rows;
  },
});
