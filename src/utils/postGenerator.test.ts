import { describe, expect, it } from 'vitest';
import { generateLinkedInPost } from './postGenerator';
import { getRLState } from './rlEngine';

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
});
