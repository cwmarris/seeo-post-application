import { describe, expect, it } from 'vitest';
import { diagnoseOpenAIKey, normalizeApiKey } from './openaiEnv';

describe('openaiEnv', () => {
  it('treats whitespace-only keys as empty', () => {
    const diag = diagnoseOpenAIKey('   ');
    expect(diag.configured).toBe(false);
  });

  it('marks non-empty keys as configured', () => {
    const diag = diagnoseOpenAIKey('sk-test-key');
    expect(diag.configured).toBe(true);
    expect(diag.status).toBe('configured');
  });

  it('normalizes keys', () => {
    expect(normalizeApiKey('  sk-x  ')).toBe('sk-x');
  });
});
