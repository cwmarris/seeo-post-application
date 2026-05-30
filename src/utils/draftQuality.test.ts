import { describe, expect, it } from 'vitest';
import { generateLinkedInPost } from './postGenerator';
import { getRLState, filterBannedPhrases } from './rlEngine';
import {
  findBannedPhrasesInText,
  enforceDraftLength,
  getLengthBand,
  hasAuthorPreferredHashtags,
  isWithinLengthBand,
  LINKEDIN_FLUFF_BANNED,
  parseCharRange,
} from './draftQuality';
import { TARGET_LENGTH_GUIDANCE } from '../../server/openaiModels.js';
import { buildDraftPromptMessages } from '../../server/openaiDraft.js';

describe('draftQuality helpers', () => {
  it('parses character ranges from length guidance', () => {
    expect(parseCharRange('550–850')).toEqual({ min: 550, max: 850 });
    expect(parseCharRange('1,200–1,600')).toEqual({ min: 1200, max: 1600 });
  });

  it('exposes consistent bands for short, medium, and long', () => {
    expect(getLengthBand('short')).toEqual({ min: 550, max: 850 });
    expect(getLengthBand('medium')).toEqual({ min: 850, max: 1200 });
    expect(getLengthBand('long')).toEqual({ min: 1200, max: 1600 });
    expect(TARGET_LENGTH_GUIDANCE.short.charRange).toBe('550–850');
    expect(TARGET_LENGTH_GUIDANCE.long.charRange).toBe('1,200–1,600');
  });

  it('detects length band membership with tolerance', () => {
    const shortPad = 'x'.repeat(700);
    expect(isWithinLengthBand(shortPad, 'short')).toBe(true);
    expect(isWithinLengthBand('x'.repeat(200), 'short')).toBe(false);
    expect(isWithinLengthBand('x'.repeat(2000), 'long')).toBe(false);
  });

  it('enforces the medium maximum while preserving trailing hashtags', () => {
    const longDraft = [
      'Warehouse safety improves when leaders can see weak signals before they become incidents.',
      'One practical example is pedestrian and forklift separation. '.repeat(20),
      'The point is not surveillance. The point is coaching from evidence while the work is still recoverable. '.repeat(10),
      '#WorkplaceSafety #AI #seeo',
    ].join('\n\n');

    const result = enforceDraftLength(longDraft, 'medium');

    expect(result.wasTrimmed).toBe(true);
    expect(result.finalLength).toBeLessThanOrEqual(1200);
    expect(result.content).toContain('#WorkplaceSafety #AI #seeo');
  });

  it('removes response wrappers and title labels during length normalization', () => {
    const result = enforceDraftLength('```text\nLinkedIn post: A practical safety note.\n```', 'short');
    expect(result.content).toBe('A practical safety note.');
  });

  it('flags banned and fluff phrases in draft text', () => {
    const rl = getRLState();
    const found = findBannedPhrasesInText(
      "I'm excited to share our game-changer synergy with you.",
      rl.bannedWords
    );
    expect(found).toContain("i'm excited to share");
    expect(found).toContain('game-changer');
    expect(LINKEDIN_FLUFF_BANNED.some((p) => found.includes(p))).toBe(true);
  });

  it('requires Craig preferred hashtags when checking author output', () => {
    expect(hasAuthorPreferredHashtags('#WorkplaceSafety … #seeo', 'craig')).toBe(true);
    expect(hasAuthorPreferredHashtags('No tags here', 'craig')).toBe(false);
  });
});

describe('local template draft output (no OpenAI)', () => {
  const rl = getRLState();

  it('default Craig draft includes preferred hashtags and no author-name tag', () => {
    const { content } = generateLinkedInPost('craig', 'Thought Leader', ['Social'], '', rl, {
      variationSeed: 99,
    });
    expect(hasAuthorPreferredHashtags(content, 'craig')).toBe(true);
    expect(content).not.toMatch(/#CraigMarris\b/);
    expect(findBannedPhrasesInText(content, rl.bannedWords)).toEqual([]);
  });

  it('filtered output removes RL banned words', () => {
    const dirty = 'We must delve into this testament to game-changing synergy.';
    const { cleanText, replacedCount } = filterBannedPhrases(dirty);
    expect(replacedCount).toBeGreaterThan(0);
    expect(findBannedPhrasesInText(cleanText, rl.bannedWords)).toEqual([]);
  });

  it('Craig milestone template has stable structure (hook arc, tagline, hashtags)', () => {
    const { content } = generateLinkedInPost('craig', 'Thought Leader', ['Social'], '', rl, {
      variationSeed: 7,
      topic: 'Announcement: a new chapter',
      templateMode: 'craig_milestone',
    });
    expect(content).toContain('Same drive, new frontier.');
    expect(content).toMatch(/onwards and upwards/i);
    expect(content).toContain('Announcement: a new chapter');
    expect(hasAuthorPreferredHashtags(content, 'craig')).toBe(true);
    expect(content.split('\n\n').length).toBeGreaterThanOrEqual(7);
    expect(findBannedPhrasesInText(content, rl.bannedWords)).toEqual([]);
  });
});

describe('draft prompt length bands (no API call)', () => {
  const base = {
    mode: 'generate' as const,
    authorId: 'craig',
    authorName: 'Craig Marris',
    authorBio: 'Founder',
    tone: 'Thought Leader',
    steepFocus: ['Social'],
    rlContext: {
      bannedWords: ['synergy'],
      steepWeights: { Social: 50 },
      emojiDensity: 'low',
      hookStyle: 'empirical',
      averageRating: 4,
    },
  };

  it.each([
    ['short', '550–850'],
    ['medium', '850–1,200'],
    ['long', '1,200–1,600'],
  ] as const)('embeds %s band in prompts', (targetLength, range) => {
    const prompts = buildDraftPromptMessages({ ...base, targetLength });
    expect(prompts.system).toContain(range);
    expect(prompts.user).toContain(range);
  });

  it('lists banned phrases in system prompt for OpenAI', () => {
    const prompts = buildDraftPromptMessages({
      ...base,
      rlContext: { ...base.rlContext, bannedWords: ['delve', 'synergy'] },
    });
    expect(prompts.system).toContain('delve');
    expect(prompts.system).toContain('synergy');
    expect(prompts.system).toMatch(/excited to share/i);
  });
});
