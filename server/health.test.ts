import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildHealthResponse } from './health';

const envSnapshot = { ...process.env };

afterEach(() => {
  process.env = { ...envSnapshot };
  vi.unstubAllEnvs();
});

describe('buildHealthResponse', () => {
  it('serverless mode never returns missing_env_file', () => {
    vi.stubEnv('VERCEL', '1');
    const payload = buildHealthResponse(undefined, { localDev: false });
    expect(payload.openai.status).not.toBe('missing_env_file');
    expect(payload.openai.message).not.toMatch(/\.env\.example/i);
  });

  it('does not echo API keys in the health payload', () => {
    const payload = buildHealthResponse('sk-live-secret', { localDev: false });
    expect(payload.openai.status).toBe('configured');
    expect(JSON.stringify(payload)).not.toContain('sk-live-secret');
  });
});
