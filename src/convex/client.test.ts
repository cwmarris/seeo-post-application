import { afterEach, describe, expect, it, vi } from 'vitest';
import { getConvexDisplayHost, getConvexUrl, isConvexConfigured } from './client';

describe('getConvexUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns undefined in test mode', () => {
    vi.stubEnv('MODE', 'test');
    expect(getConvexUrl()).toBeUndefined();
    expect(isConvexConfigured()).toBe(false);
  });

  it('ignores localhost URLs in production builds', () => {
    vi.stubEnv('MODE', 'production');
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_CONVEX_URL', 'http://127.0.0.1:3210');
    expect(getConvexUrl()).toBeUndefined();
    expect(isConvexConfigured()).toBe(false);
  });

  it('keeps cloud deployment URLs in production builds', () => {
    vi.stubEnv('MODE', 'production');
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_CONVEX_URL', 'https://festive-mule-943.convex.cloud');
    expect(getConvexUrl()).toBe('https://festive-mule-943.convex.cloud');
    expect(getConvexDisplayHost()).toBe('festive-mule-943.convex.cloud');
    expect(isConvexConfigured()).toBe(true);
  });
});
