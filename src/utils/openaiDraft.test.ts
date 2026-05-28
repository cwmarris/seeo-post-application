import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { improveDraftViaApi } from './openaiDraft';

describe('improveDraftViaApi', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, init) => {
        const body = JSON.parse((init as RequestInit).body as string) as Record<string, unknown>;
        return {
          ok: true,
          status: 200,
          json: async () => ({ content: 'Improved', model: 'gpt-5.5', sent: body }),
        };
      })
    );
  });

  afterEach(() => {
    vi.stubGlobal('fetch', originalFetch);
    vi.restoreAllMocks();
  });

  it('includes revisionGuidance on improve requests only', async () => {
    await improveDraftViaApi({
      mode: 'improve',
      authorId: 'craig',
      authorName: 'Craig',
      authorBio: 'Bio',
      tone: 'Thought Leader',
      steepFocus: ['Social'],
      draft: 'Hello world',
      revisionGuidance: 'Shorten the hook.',
      rlContext: {
        bannedWords: [],
        steepWeights: { Social: 50 },
        emojiDensity: 'low',
        hookStyle: 'empirical',
        averageRating: 4,
      },
    });

    const fetchMock = vi.mocked(globalThis.fetch);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.revisionGuidance).toBe('Shorten the hook.');
    expect(body.generationInstructions).toBeUndefined();
    expect(body.mode).toBe('improve');
  });
});
