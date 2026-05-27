import { describe, expect, it } from 'vitest';
import { generateLinkedInPost } from './postGenerator';
import { getRLState } from './rlEngine';
import { getAuthorStyleSettings } from './authorStyles';

describe('generateLinkedInPost', () => {
  it('varies content when STEEP lenses differ', () => {
    const rl = getRLState();
    const a = generateLinkedInPost('craig', 'Thought Leader', ['Social', 'Economic'], '', rl, {
      variationSeed: 42,
    });
    const b = generateLinkedInPost('craig', 'Thought Leader', ['Political', 'Environmental'], '', rl, {
      variationSeed: 42,
    });
    expect(a.content).not.toBe(b.content);
  });

  it('differs by author', () => {
    const rl = getRLState();
    const craig = generateLinkedInPost('craig', 'Thought Leader', ['Social'], '', rl, {
      variationSeed: 42,
    });
    const dean = generateLinkedInPost('dean', 'Thought Leader', ['Social'], '', rl, {
      variationSeed: 42,
    });
    expect(craig.content).not.toBe(dean.content);
  });

  it('applies Craig style hashtags and avoids author-name tag', () => {
    const rl = getRLState();
    const craig = generateLinkedInPost('craig', 'Thought Leader', ['Technological'], '', rl, {
      variationSeed: 42,
    });
    const settings = getAuthorStyleSettings('craig');
    expect(craig.content).toContain(settings.preferredHashtags[0]);
    expect(craig.content).toContain(settings.preferredHashtags[settings.preferredHashtags.length - 1]);
    expect(craig.content).not.toMatch(/#CraigMarris\b/);
  });
});
