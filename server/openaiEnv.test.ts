import { afterEach, describe, expect, it, vi } from 'vitest';
import { diagnoseOpenAIKey, envIo, isPlatformManagedRuntime, normalizeApiKey } from './openaiEnv';

const envSnapshot = { ...process.env };

afterEach(() => {
  process.env = { ...envSnapshot };
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('openaiEnv', () => {
  it('treats whitespace-only keys as missing', () => {
    const diag = diagnoseOpenAIKey('   ', { localDev: true });
    expect(diag.configured).toBe(false);
    expect(diag.status).not.toBe('configured');
  });

  it('marks non-empty keys as configured', () => {
    const diag = diagnoseOpenAIKey('sk-test-key', { localDev: true });
    expect(diag.configured).toBe(true);
    expect(diag.status).toBe('configured');
  });

  it('normalizes keys', () => {
    expect(normalizeApiKey('  sk-x  ')).toBe('sk-x');
  });

  it('detects Vercel as platform-managed', () => {
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('NODE_ENV', 'development');
    expect(isPlatformManagedRuntime()).toBe(true);
  });

  it('on Vercel without key returns missing_key, not missing_env_file', () => {
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('OPENAI_API_KEY', '');
    const diag = diagnoseOpenAIKey(process.env.OPENAI_API_KEY);
    expect(diag.status).toBe('missing_key');
    expect(diag.status).not.toBe('missing_env_file');
    expect(diag.message).toMatch(/Vercel/i);
    expect(diag.message).not.toMatch(/\.env\.example/i);
  });

  it('on Vercel with key returns configured without exposing the key', () => {
    vi.stubEnv('VERCEL', '1');
    const diag = diagnoseOpenAIKey('sk-secret-value');
    expect(diag.status).toBe('configured');
    expect(JSON.stringify(diag)).not.toContain('sk-secret');
  });

  it('production NODE_ENV without key returns missing_key', () => {
    vi.stubEnv('VERCEL', '');
    vi.stubEnv('VERCEL_ENV', '');
    vi.stubEnv('NODE_ENV', 'production');
    const diag = diagnoseOpenAIKey('');
    expect(diag.status).toBe('missing_key');
    expect(diag.status).not.toBe('missing_env_file');
  });

  it('local dev with no env file returns missing_env_file', () => {
    vi.stubEnv('VERCEL', '');
    vi.stubEnv('VERCEL_ENV', '');
    vi.stubEnv('NODE_ENV', 'development');
    vi.spyOn(envIo, 'existsSync').mockReturnValue(false);
    const diag = diagnoseOpenAIKey('', { localDev: true });
    expect(diag.status).toBe('missing_env_file');
    expect(diag.message).toMatch(/\.env\.example/i);
  });
});
