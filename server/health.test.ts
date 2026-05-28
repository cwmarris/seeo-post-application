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

  it('includes resolved model slugs without secrets', () => {
    vi.stubEnv('OPENAI_DRAFT_MODEL', 'gpt-4.1');
    vi.stubEnv('OPENAI_IMAGE_MODEL', 'gpt-image-2');
    vi.stubEnv('OPENAI_GROUNDED_IMAGE_MODEL', 'gpt-4o');

    const payload = buildHealthResponse(undefined, { localDev: false });
    expect(payload.draftModel).toBe('gpt-4.1');
    expect(payload.imageModel).toBe('gpt-image-2');
    expect(payload.groundedImageModel).toBe('gpt-4o');
    expect(JSON.stringify(payload)).not.toMatch(/sk-/);
  });

  it('defaults draft and image models when env unset', () => {
    delete process.env.OPENAI_DRAFT_MODEL;
    delete process.env.OPENAI_IMAGE_MODEL;
    delete process.env.OPENAI_GROUNDED_IMAGE_MODEL;

    const payload = buildHealthResponse(undefined, { localDev: false });
    expect(payload.draftModel).toBe('gpt-5.5');
    expect(payload.imageModel).toBe('gpt-image-2');
    expect(payload.groundedImageModel).toBe('gpt-5.5');
  });
});
