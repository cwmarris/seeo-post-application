import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { generateVisualAsset, imagesApiUrl } from './openaiImages';

describe('imagesApiUrl', () => {
  it('defaults to same-origin path', () => {
    expect(imagesApiUrl()).toBe('/api/openai/images');
  });
});

describe('generateVisualAsset', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            imageDataUrl: 'data:image/png;base64,abc',
            model: 'gpt-image-2',
          }),
      }))
    );
  });

  afterEach(() => {
    vi.stubGlobal('fetch', originalFetch);
    vi.restoreAllMocks();
  });

  it('rejects empty prompt before calling the API', async () => {
    await expect(
      generateVisualAsset({ prompt: '   ', style: 'editorial' })
    ).rejects.toThrow(/visual prompt/i);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('surfaces server error messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: 'Billing hard limit has been reached.' }),
      }))
    );

    await expect(
      generateVisualAsset({ prompt: 'Warehouse scene', style: 'editorial' })
    ).rejects.toThrow(/Billing hard limit/);
  });

  it('detects HTML misconfiguration responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 404,
        text: async () => '<!doctype html><html><body>Not found</body></html>',
      }))
    );

    await expect(
      generateVisualAsset({ prompt: 'Warehouse scene', style: 'editorial' })
    ).rejects.toThrow(/Image API route not found/i);
  });
});
