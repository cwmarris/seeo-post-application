import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { handleGroundedImageBody } from './openaiGroundedImage.js';

describe('handleGroundedImageBody', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'Yellow caution tape on a conveyor.' } }],
        }),
      }))
    );
  });

  afterEach(() => {
    vi.stubGlobal('fetch', originalFetch);
    vi.restoreAllMocks();
  });

  it('returns 503 when API key is missing', async () => {
    const result = await handleGroundedImageBody(
      { fileName: 'a.jpg', mimeType: 'image/jpeg', imageBase64: 'abc' },
      '',
      'gpt-4o-mini'
    );
    expect(result.status).toBe(503);
  });

  it('returns extracted text when OpenAI succeeds', async () => {
    const result = await handleGroundedImageBody(
      {
        fileName: 'site.jpg',
        mimeType: 'image/jpeg',
        imageBase64: 'data:image/jpeg;base64,abc',
      },
      'sk-test-key',
      'gpt-4o-mini'
    );

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      textContent: expect.stringContaining('[Image: site.jpg]'),
    });
    if ('textContent' in result.body) {
      expect(result.body.textContent).toContain('caution tape');
    }
  });
});
