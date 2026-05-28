import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DRAFT_MODEL,
  isAllowedRequestDraftModel,
  resolveDraftModel,
  resolveGroundedImageModel,
} from './openaiModels.js';

describe('openaiModels', () => {
  it('defaults draft model to gpt-4.1', () => {
    expect(DEFAULT_DRAFT_MODEL).toBe('gpt-4.1');
    expect(resolveDraftModel(undefined)).toBe('gpt-4.1');
  });

  it('uses env model when set', () => {
    expect(resolveDraftModel('gpt-4o')).toBe('gpt-4o');
  });

  it('allows allowlisted request model over env', () => {
    expect(resolveDraftModel('gpt-4o', 'gpt-4.1-mini')).toBe('gpt-4.1-mini');
  });

  it('rejects non-allowlisted request model', () => {
    expect(resolveDraftModel('gpt-4.1', 'gpt-5-ultra')).toBe('gpt-4.1');
    expect(resolveDraftModel(undefined, 'o1-preview')).toBe('gpt-4.1');
  });

  it('recognizes allowlisted models', () => {
    expect(isAllowedRequestDraftModel('gpt-4o-mini')).toBe(true);
    expect(isAllowedRequestDraftModel('gpt-5')).toBe(false);
  });

  it('resolves grounded image model with same allowlist rules', () => {
    expect(resolveGroundedImageModel(undefined, undefined)).toBe('gpt-4.1');
    expect(resolveGroundedImageModel('gpt-4o', 'gpt-4.1', 'gpt-4o-mini')).toBe('gpt-4o-mini');
    expect(resolveGroundedImageModel('gpt-4o', 'gpt-4.1', 'evil-model')).toBe('gpt-4o');
  });
});
