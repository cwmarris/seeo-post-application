import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  buildDraftPromptMessages,
  handleGenerateDraftBody,
  type GenerateDraftBody,
} from './openaiDraft.js';

const baseBody: GenerateDraftBody = {
  mode: 'generate',
  authorId: 'craig',
  authorName: 'Craig Marris',
  authorBio: 'Founder at seeo.ai',
  tone: 'Thought Leader',
  steepFocus: ['Social', 'Technological'],
  rlContext: {
    bannedWords: ['synergy'],
    steepWeights: { Social: 70, Technological: 80 },
    emojiDensity: 'low',
    hookStyle: 'empirical',
    averageRating: 4,
  },
};

describe('buildDraftPromptMessages', () => {
  it('injects generation instructions into system and user prompts', () => {
    const prompts = buildDraftPromptMessages({
      ...baseBody,
      generationInstructions: 'Mention the Auckland pilot and CTA to book a demo.',
      topic: 'warehouse near-miss detection',
    });

    expect(prompts.system).toContain('Author generation instructions');
    expect(prompts.system).toContain('Auckland pilot');
    expect(prompts.user).toContain('Additional instructions from the author');
    expect(prompts.user).toContain('warehouse near-miss detection');
  });

  it('applies target length guidance for short posts', () => {
    const prompts = buildDraftPromptMessages({
      ...baseBody,
      targetLength: 'short',
    });

    expect(prompts.system).toContain('550–850');
    expect(prompts.user).toContain('550–850');
  });

  it('injects revision guidance prominently in improve mode', () => {
    const prompts = buildDraftPromptMessages({
      ...baseBody,
      mode: 'improve',
      draft: 'Draft text here.',
      revisionGuidance: 'Tighten the opening hook and shorten paragraph two.',
      targetLength: 'medium',
    });

    expect(prompts.user).toContain('REVISION GUIDANCE');
    expect(prompts.user).toContain('Tighten the opening hook');
    expect(prompts.user).not.toContain('honor these instructions');
    expect(prompts.system).toContain('850–1,200');
  });

  it('keeps original generation brief secondary on improve when both are set', () => {
    const prompts = buildDraftPromptMessages({
      ...baseBody,
      mode: 'improve',
      draft: 'Draft text here.',
      generationInstructions: 'Mention Auckland pilot.',
      revisionGuidance: 'Sharpen the CTA.',
      targetLength: 'medium',
    });

    expect(prompts.user).toContain('Sharpen the CTA');
    expect(prompts.user).toContain('Original generation brief');
    expect(prompts.user).toContain('Auckland pilot');
  });

  it('enforces LinkedIn brevity rules in system prompt', () => {
    const prompts = buildDraftPromptMessages(baseBody);
    expect(prompts.system).toMatch(/hook/i);
    expect(prompts.system).toMatch(/No fluff/i);
    expect(prompts.system).not.toMatch(/1200-1800/);
  });
});

describe('handleGenerateDraftBody', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url, init) => {
        const body = JSON.parse((init as RequestInit).body as string) as {
          messages: Array<{ role: string; content: string }>;
        };
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    systemHasInstructions: body.messages[0]?.content.includes('Auckland pilot'),
                    userHasLength: body.messages[1]?.content.includes('550–850'),
                  }),
                },
              },
            ],
          }),
        };
      })
    );
  });

  afterEach(() => {
    vi.stubGlobal('fetch', originalFetch);
    vi.restoreAllMocks();
  });

  it('sends improve-mode revision guidance in the user message (not generation brief)', async () => {
    await handleGenerateDraftBody(
      {
        ...baseBody,
        mode: 'improve',
        draft: 'Original draft text.',
        revisionGuidance: 'Sharpen the CTA and cut the second paragraph.',
        targetLength: 'long',
      },
      'sk-test-key',
      'gpt-5.5'
    );

    const fetchMock = vi.mocked(globalThis.fetch);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(init.body as string) as {
      messages: Array<{ role: string; content: string }>;
    };
    expect(payload.messages[1]?.content).toContain('REVISION GUIDANCE');
    expect(payload.messages[1]?.content).toContain('Sharpen the CTA');
    expect(payload.messages[1]?.content).not.toContain('Author generation instructions');
    expect(payload.messages[1]?.content).toContain('1,200–1,600');
    expect(payload.messages[0]?.content).toContain('1,200–1,600');
  });

  it('passes generation instructions and target length to OpenAI messages', async () => {
    await handleGenerateDraftBody(
      {
        ...baseBody,
        generationInstructions: 'Auckland pilot',
        targetLength: 'short',
      },
      'sk-test-key',
      'gpt-4.1'
    );

    const fetchMock = vi.mocked(globalThis.fetch);
    expect(fetchMock).toHaveBeenCalled();
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(init.body as string) as {
      messages: Array<{ content: string }>;
    };
    expect(payload.messages[0]?.content).toContain('Auckland pilot');
    expect(payload.messages[1]?.content).toContain('550–850');
  });
});
